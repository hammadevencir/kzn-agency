/**
 * One-time (or idempotent) bootstrap: creates the default admin in Firebase Auth
 * and Firestore `users/{uid}` with role `admin`, plus Auth custom claims.
 *
 * Requires the same Firebase Admin env vars as the Next app (.env.local):
 * FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY
 *
 * Usage: npm run seed:admin
 *
 * Override defaults:
 *   SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
 *
 * Admin sub-roles (see lib/auth/admin-permissions.js):
 *   --role manager   (default) full access
 *   --role support   customer service — no Settings / Affiliate Requests /
 *                    Contact Requests / Financial
 * Optional flags (override env): --email <email> --password <pwd> --name <display name>
 *
 * Example (customer service login):
 *   npm run seed:admin -- --role support --email cs@kzn.com --password 'S3cret!pass' --name "Customer Service"
 *
 * Re-running for an existing email updates its password/role and revokes its
 * refresh tokens so the new role applies on next sign-in.
 */

const fs = require("fs");
const path = require("path");
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const ROOT = path.join(__dirname, "..");
const ENV_PATH = path.join(ROOT, ".env.local");

function loadEnvLocal() {
  if (!fs.existsSync(ENV_PATH)) return;
  const text = fs.readFileSync(ENV_PATH, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvLocal();

function argValue(name) {
  const argv = process.argv.slice(2);
  const i = argv.indexOf(`--${name}`);
  if (i !== -1 && argv[i + 1] && !argv[i + 1].startsWith("--")) return argv[i + 1];
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  return eq ? eq.slice(name.length + 3) : undefined;
}

const ADMIN_EMAIL = (
  argValue("email") || process.env.SEED_ADMIN_EMAIL || "admin@kzn.com"
).toLowerCase();
const ADMIN_PASSWORD =
  argValue("password") || process.env.SEED_ADMIN_PASSWORD || "password";
const DISPLAY_NAME = argValue("name");
const ADMIN_ROLE = "admin";
/** Admin sub-role: "manager" (default) | "support" (customer service). */
const ADMIN_SUB_ROLE = argValue("role") || "manager";
if (!["manager", "support"].includes(ADMIN_SUB_ROLE)) {
  console.error('--role must be "manager" or "support"');
  process.exit(1);
}

function getAdminApp() {
  const existing = getApps()[0];
  if (existing) return existing;

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );

  if (!projectId || !clientEmail || !privateKey) {
    console.error(
      "Missing Firebase Admin env. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY (e.g. in .env.local)."
    );
    process.exit(1);
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

async function main() {
  getAdminApp();
  const auth = getAuth();
  const db = getFirestore();

  let uid;
  try {
    const existing = await auth.getUserByEmail(ADMIN_EMAIL);
    uid = existing.uid;
    await auth.updateUser(uid, {
      password: ADMIN_PASSWORD,
      email: ADMIN_EMAIL,
      ...(DISPLAY_NAME ? { displayName: DISPLAY_NAME } : {}),
    });
    console.log("Updated existing Auth user:", ADMIN_EMAIL, uid);
  } catch (e) {
    if (e?.code !== "auth/user-not-found") throw e;
    const created = await auth.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      ...(DISPLAY_NAME ? { displayName: DISPLAY_NAME } : {}),
      emailVerified: true,
    });
    uid = created.uid;
    console.log("Created Auth user:", ADMIN_EMAIL, uid);
  }

  await auth.setCustomUserClaims(uid, {
    role: ADMIN_ROLE,
    adminRole: ADMIN_SUB_ROLE,
  });
  // Invalidate existing sessions so a changed sub-role applies immediately.
  await auth.revokeRefreshTokens(uid);

  const userRef = db.collection("users").doc(uid);
  const snap = await userRef.get();
  const prev = snap.exists ? snap.data() : null;

  await userRef.set(
    {
      role: ADMIN_ROLE,
      adminRole: ADMIN_SUB_ROLE,
      email: ADMIN_EMAIL,
      displayName:
        DISPLAY_NAME ??
        prev?.displayName ??
        (ADMIN_SUB_ROLE === "support" ? "Customer Service" : "Admin"),
      updatedAt: FieldValue.serverTimestamp(),
      ...(snap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    },
    { merge: true }
  );

  console.log(
    "Firestore users/" + uid + " set with role:",
    ADMIN_ROLE,
    "adminRole:",
    ADMIN_SUB_ROLE
  );
  console.log("Done. Sign in at /login with this email and password.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
