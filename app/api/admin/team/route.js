import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { ROLE } from "@/lib/auth/constants";
import { ADMIN_ROLES } from "@/lib/auth/admin-permissions";
import {
  USERS_COLLECTION,
  listAdminTeam,
  requireManagerSession,
} from "@/lib/auth/admin-team-server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * GET — list admin logins (managers + customer service). Manager-only.
 */
export async function GET() {
  const gate = await requireManagerSession();
  if (gate.error) return gate.error;

  try {
    const team = await listAdminTeam(getAdminDb(), getAdminAuth());
    return NextResponse.json({ items: team, currentUid: gate.user.uid });
  } catch (e) {
    console.error("admin team list:", e);
    return NextResponse.json({ error: "list_failed" }, { status: 500 });
  }
}

/**
 * POST — create a new admin login.
 * Body: { email, displayName, password (temporary, ≥ 8 chars), adminRole: "manager" | "support" }
 */
export async function POST(request) {
  const gate = await requireManagerSession();
  if (gate.error) return gate.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const displayName =
    typeof body.displayName === "string" ? body.displayName.trim().slice(0, 80) : "";
  const password = typeof body.password === "string" ? body.password : "";
  const adminRole = body.adminRole;

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "invalid_email", message: "Enter a valid email address." },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "weak_password", message: "Temporary password must be at least 8 characters." },
      { status: 400 }
    );
  }
  if (!ADMIN_ROLES.includes(adminRole)) {
    return NextResponse.json(
      { error: "invalid_role", message: "Choose Manager or Customer Service." },
      { status: 400 }
    );
  }

  const auth = getAdminAuth();
  const db = getAdminDb();

  let created;
  try {
    created = await auth.createUser({
      email,
      password,
      displayName: displayName || undefined,
      emailVerified: true,
    });
  } catch (e) {
    /** @type {any} */
    const err = e;
    if (err?.code === "auth/email-already-exists") {
      return NextResponse.json(
        {
          error: "email_in_use",
          message: "An account with this email already exists. Use a different email.",
        },
        { status: 409 }
      );
    }
    if (err?.code === "auth/invalid-password") {
      return NextResponse.json(
        { error: "weak_password", message: "Temporary password is too weak." },
        { status: 400 }
      );
    }
    console.error("admin team create:", e);
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }

  try {
    await auth.setCustomUserClaims(created.uid, { role: ROLE.ADMIN, adminRole });
    await db.collection(USERS_COLLECTION).doc(created.uid).set({
      role: ROLE.ADMIN,
      adminRole,
      email,
      displayName: displayName || null,
      photoURL: null,
      createdBy: gate.user.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error("admin team create (profile):", e);
    // Roll back the Auth user so we don't leave a half-created login behind.
    await auth.deleteUser(created.uid).catch(() => {});
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, uid: created.uid });
}
