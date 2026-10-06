import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { ROLE } from "@/lib/auth/constants";
import { ADMIN_ROLE, ADMIN_ROLES } from "@/lib/auth/admin-permissions";
import {
  USERS_COLLECTION,
  countActiveManagers,
  listAdminTeam,
  requireManagerSession,
} from "@/lib/auth/admin-team-server";

const LAST_MANAGER = {
  error: "last_manager",
  message: "There must always be at least one active manager.",
};

async function loadTarget(context) {
  const params = await context.params;
  const uid = typeof params?.uid === "string" ? params.uid : "";
  const auth = getAdminAuth();
  const db = getAdminDb();
  const team = await listAdminTeam(db, auth);
  const target = team.find((m) => m.uid === uid) || null;
  return { uid, auth, db, team, target };
}

/** Would `team` still have an active manager after applying `change` to `uid`? */
function keepsAManager(team, uid, change) {
  const next = team
    .filter((m) => !(change.remove && m.uid === uid))
    .map((m) => (m.uid === uid ? { ...m, ...change } : m));
  return countActiveManagers(next) > 0;
}

/**
 * PATCH — update an admin login. Manager-only.
 * Body (any of): { adminRole: "manager" | "support", disabled: boolean, password: string }
 * Role/disable changes revoke the member's refresh tokens, which also
 * invalidates their session cookie — they're signed out and get the new
 * permissions on next sign-in.
 */
export async function PATCH(request, context) {
  const gate = await requireManagerSession();
  if (gate.error) return gate.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { uid, auth, db, team, target } = await loadTarget(context);
  if (!target) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const hasRole = Object.prototype.hasOwnProperty.call(body, "adminRole");
  const hasDisabled = Object.prototype.hasOwnProperty.call(body, "disabled");
  const hasPassword = typeof body.password === "string" && body.password.length > 0;

  if (hasRole && !ADMIN_ROLES.includes(body.adminRole)) {
    return NextResponse.json({ error: "invalid_role" }, { status: 400 });
  }
  if (hasDisabled && typeof body.disabled !== "boolean") {
    return NextResponse.json({ error: "invalid_disabled" }, { status: 400 });
  }
  if (hasPassword && body.password.length < 8) {
    return NextResponse.json(
      { error: "weak_password", message: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }
  if (hasDisabled && body.disabled && uid === gate.user.uid) {
    return NextResponse.json(
      { error: "cannot_disable_self", message: "You can't disable your own login." },
      { status: 400 }
    );
  }

  const roleChanged = hasRole && body.adminRole !== target.adminRole;
  const disabledChanged = hasDisabled && body.disabled !== target.disabled;

  if (
    (roleChanged || disabledChanged) &&
    !keepsAManager(team, uid, {
      ...(roleChanged ? { adminRole: body.adminRole } : {}),
      ...(disabledChanged ? { disabled: body.disabled } : {}),
    })
  ) {
    return NextResponse.json(LAST_MANAGER, { status: 400 });
  }

  try {
    /** @type {import("firebase-admin/auth").UpdateRequest} */
    const authUpdate = {};
    if (disabledChanged) authUpdate.disabled = body.disabled;
    if (hasPassword) authUpdate.password = body.password;
    if (Object.keys(authUpdate).length) await auth.updateUser(uid, authUpdate);

    if (roleChanged) {
      await auth.setCustomUserClaims(uid, {
        role: ROLE.ADMIN,
        adminRole: body.adminRole,
      });
      await db.collection(USERS_COLLECTION).doc(uid).set(
        { adminRole: body.adminRole, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
    }

    // Force the member out so the new role / disabled state applies now
    // (verifySessionCookie(..., true) rejects revoked sessions).
    if (roleChanged || disabledChanged || hasPassword) {
      await auth.revokeRefreshTokens(uid);
    }
  } catch (e) {
    console.error("admin team update:", e);
    /** @type {any} */
    const err = e;
    if (err?.code === "auth/invalid-password") {
      return NextResponse.json({ error: "weak_password" }, { status: 400 });
    }
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, signedOut: roleChanged || disabledChanged || hasPassword });
}

/**
 * DELETE — remove an admin login (deletes the Firebase Auth user and its
 * users/{uid} profile). Manager-only. The last active manager can't be removed.
 */
export async function DELETE(_request, context) {
  const gate = await requireManagerSession();
  if (gate.error) return gate.error;

  const { uid, auth, db, team, target } = await loadTarget(context);
  if (!target) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (uid === gate.user.uid) {
    return NextResponse.json(
      { error: "cannot_remove_self", message: "You can't remove your own login." },
      { status: 400 }
    );
  }
  if (target.adminRole === ADMIN_ROLE.MANAGER && !keepsAManager(team, uid, { remove: true })) {
    return NextResponse.json(LAST_MANAGER, { status: 400 });
  }

  try {
    if (!target.missingAuth) await auth.deleteUser(uid);
    await db.collection(USERS_COLLECTION).doc(uid).delete();
  } catch (e) {
    console.error("admin team delete:", e);
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
