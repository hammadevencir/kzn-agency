/**
 * One-off backfill for the 2026-09 package rename (White Hat → Agency,
 * VIP → Supplements). Fixes only the stored *names* — never the tier, price or
 * top-up fee (legacy tiers stay grandfathered until they renew):
 *   - subscriptions: `flow.planName` → "Agency — START" / "Supplements — ESSENTIAL"
 *     (matching what new subscriptions and migrated renewals store);
 *   - ad accounts:   `flow.planName` "Meta White Hat" / "Meta VIP" → "Meta Agency" /
 *     "Meta Supplements".
 *
 * Dry run by default (prints what would change). Pass --apply to write.
 *
 * Requires FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL,
 * FIREBASE_ADMIN_PRIVATE_KEY (read from .env.local, then .env).
 *
 * Usage: node scripts/backfill-plan-labels.cjs [--apply]
 */

const fs = require("fs");
const path = require("path");
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const ROOT = path.join(__dirname, "..");

/** Supports multi-line double-quoted values (the private key). */
function loadEnvFile(file) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return;
  const text = fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
  for (const m of text.matchAll(/^([A-Z0-9_]+)=(?:"([\s\S]*?)"|'([^']*)'|(.*))$/gm)) {
    if (process.env[m[1]] === undefined) process.env[m[1]] = m[2] ?? m[3] ?? m[4];
  }
}
loadEnvFile(".env.local");
loadEnvFile(".env");

const APPLY = process.argv.includes("--apply");

const CATEGORY_LABEL = { vip: "Supplements", white_hat: "Agency" };

/** @param {unknown} raw */
function normalizeCategory(raw) {
  const c = String(raw ?? "").trim().toLowerCase();
  if (c === "vip") return "vip";
  if (c === "white_hat" || c === "white hat" || c === "white-hat") return "white_hat";
  return null;
}

function init() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing FIREBASE_ADMIN_* env vars (.env.local / .env).");
  }
  if (!getApps().length) {
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }
  return getFirestore();
}

async function main() {
  const db = init();
  /** @type {{ ref: FirebaseFirestore.DocumentReference, from: unknown, to: string }[]} */
  const changes = [];

  const subs = await db.collection("subscriptions").get();
  for (const doc of subs.docs) {
    const flow = doc.data().flow || {};
    const platform = String(doc.data().platformId || flow.platformKey || "").toLowerCase();
    const cat = normalizeCategory(flow.accountCategory);
    const tier = typeof flow.planTier === "string" ? flow.planTier.trim().toUpperCase() : "";
    if (platform !== "meta" || !cat || !tier) continue;
    const want = `${CATEGORY_LABEL[cat]} — ${tier}`;
    if (flow.planName !== want) changes.push({ ref: doc.ref, from: flow.planName, to: want });
  }

  const ads = await db.collection("ad-accounts").get();
  for (const doc of ads.docs) {
    const flow = doc.data().flow || {};
    const platform = String(flow.platformKey || "").toLowerCase();
    const cat = normalizeCategory(flow.accountCategory);
    if (platform !== "meta" || !cat) continue;
    const want = `Meta ${CATEGORY_LABEL[cat]}`;
    if (flow.planName !== want) changes.push({ ref: doc.ref, from: flow.planName, to: want });
  }

  for (const c of changes) {
    console.log(`${c.ref.path}: ${JSON.stringify(c.from ?? null)} → ${JSON.stringify(c.to)}`);
  }
  console.log(`\n${changes.length} doc(s) to update.`);
  if (!APPLY) {
    console.log("Dry run — re-run with --apply to write.");
    return;
  }

  for (let i = 0; i < changes.length; i += 400) {
    const batch = db.batch();
    for (const c of changes.slice(i, i + 400)) {
      // `updatedAt` is left alone on purpose: it ranks "latest" subscription
      // docs in the plan checks, and a label fix must not reorder them.
      batch.update(c.ref, { "flow.planName": c.to });
    }
    await batch.commit();
  }
  console.log("Applied.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
