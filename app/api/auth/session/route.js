import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_MS,
  ROLE,
} from "@/lib/auth/constants";
import { normalizeAdminRole } from "@/lib/auth/admin-permissions";

const ALLOWED_ROLES = [ROLE.ADMIN, ROLE.USER];

export async function POST(request) {
  try {
    const body = await request.json();
    const idToken = body.idToken;
    const portal =
      typeof body.portal === "string" ? body.portal.trim() : "";
    const autoRole = body.autoRole === true;
    const phone =
      typeof body.phone === "string" && body.phone.trim()
        ? body.phone.trim().slice(0, 40)
        : null;

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json({ error: "missing_token" }, { status: 400 });
    }
    if (autoRole && portal) {
      return NextResponse.json(
        { error: "invalid_request" },
        { status: 400 }
      );
    }
    if (!autoRole && (!portal || !ALLOWED_ROLES.includes(portal))) {
      return NextResponse.json({ error: "missing_portal" }, { status: 400 });
    }

    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);
    const uid = decoded.uid;
    const email = decoded.email ?? null;

    const db = getAdminDb();
    const userRef = db.collection("users").doc(uid);
    const snap = await userRef.get();

    let role;
    /** Admin sub-role (users/{uid}.adminRole); missing ⇒ "manager". */
    let adminRole = null;

    const photoURL =
      typeof decoded.picture === "string" && decoded.picture ? decoded.picture : null;

    if (!snap.exists) {
      if (!autoRole && portal === ROLE.ADMIN) {
        return NextResponse.json(
          {
            error: "no_admin_profile",
            message: "No admin access for this account.",
          },
          { status: 403 }
        );
      }
      // New account (email/password signup or first Google sign-in from either
      // /login or /user/signup): always a regular user. Phone is optional here —
      // Google users don't provide one; they can add it later in settings.
      role = ROLE.USER;
      await userRef.set({
        role,
        email,
        displayName: decoded.name ?? null,
        photoURL,
        phone: phone ?? "",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastLoginAt: FieldValue.serverTimestamp(),
      });
    } else {
      const data = snap.data();
      role = data?.role;
      if (!ALLOWED_ROLES.includes(role)) {
        return NextResponse.json({ error: "invalid_role" }, { status: 403 });
      }
      if (role === ROLE.ADMIN) adminRole = normalizeAdminRole(data?.adminRole);
      if (!autoRole && portal !== role) {
        return NextResponse.json(
          {
            error: "wrong_portal",
            message:
              "This account belongs to a different portal. Use the correct sign-in page.",
          },
          { status: 403 }
        );
      }
      await userRef.set(
        {
          email,
          displayName: decoded.name ?? data?.displayName ?? null,
          ...(phone && !data?.phone ? { phone } : {}),
          ...(photoURL && !data?.photoURL ? { photoURL } : {}),
          updatedAt: FieldValue.serverTimestamp(),
          lastLoginAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    // Compare normalized sub-roles so pre-existing admins (claim without
    // `adminRole`) aren't forced through an extra token refresh.
    const claimAdminRole =
      decoded.role === ROLE.ADMIN ? normalizeAdminRole(decoded.adminRole) : null;
    if (decoded.role !== role || claimAdminRole !== adminRole) {
      await auth.setCustomUserClaims(
        uid,
        role === ROLE.ADMIN ? { role, adminRole } : { role }
      );
      return NextResponse.json({ needsTokenRefresh: true, role });
    }

    const expiresInMs = SESSION_MAX_AGE_MS;
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: expiresInMs,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(expiresInMs / 1000),
    });

    return NextResponse.json({ ok: true, role });
  } catch (e) {
    console.error("auth session:", e);
    /** @type {any} */
    const err = e;
    const code =
      typeof err?.code === "string" ? err.code : "session_failed";
    const rawMessage =
      typeof err?.message === "string" ? err.message : "";
    let friendlyMessage = "We couldn't start your session. Please try again.";
    if (code.includes("id-token-expired")) {
      friendlyMessage = "Your sign-in token expired. Please try again.";
    } else if (code.includes("argument-error")) {
      friendlyMessage = "Invalid sign-in token. Please try again.";
    }
    return NextResponse.json(
      {
        error: code,
        message: friendlyMessage,
        debug: process.env.NODE_ENV !== "production" ? rawMessage : undefined,
      },
      { status: 401 }
    );
  }
}
