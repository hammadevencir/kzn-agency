import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import {
  ARTICLES_COLLECTION,
  ARTICLE_MAX_BODY_LENGTH,
  ARTICLE_MAX_TITLE_LENGTH,
} from "@/lib/articles/constants";
import { relativeTime, tsMs } from "@/lib/notifications/helpers";

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 */
export async function listArticlesForAdmin(db) {
  const snap = await db
    .collection(ARTICLES_COLLECTION)
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();

  return snap.docs.map((d) => serializeArticleDoc(d.id, d.data()));
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 */
export async function listArticlesForUser(db) {
  const snap = await db
    .collection(ARTICLES_COLLECTION)
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();

  return snap.docs.map((d) => serializeArticleDoc(d.id, d.data()));
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {{
 *   title: string,
 *   body: string,
 *   excerpt: string,
 *   pdfUrl: string,
 *   pdfPath: string,
 *   fileName: string,
 *   fileSize: number,
 *   adminUid: string,
 *   adminEmail?: string | null,
 * }} input
 */
export async function createArticle(db, input) {
  const title = String(input.title || "").trim().slice(0, ARTICLE_MAX_TITLE_LENGTH);
  const body = String(input.body || "").trim().slice(0, ARTICLE_MAX_BODY_LENGTH);

  if (!title || !body) {
    return { error: "missing_fields", status: 400 };
  }

  const ref = db.collection(ARTICLES_COLLECTION).doc();
  await ref.set({
    title,
    body,
    excerpt: String(input.excerpt || "").trim(),
    pdfUrl: input.pdfUrl,
    pdfPath: input.pdfPath,
    fileName: input.fileName || null,
    fileSize: typeof input.fileSize === "number" ? input.fileSize : null,
    createdBy: input.adminUid,
    createdByEmail: input.adminEmail ?? null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return { id: ref.id };
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} id
 */
export async function getArticleForAdmin(db, id) {
  const snap = await db.collection(ARTICLES_COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return { doc: snap, data: snap.data() };
}

/**
 * @param {import("firebase-admin/firestore").Firestore} db
 * @param {string} id
 */
export async function deleteArticle(db, id) {
  const ref = db.collection(ARTICLES_COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return { error: "not_found", status: 404 };
  }

  await ref.delete();
  return { ok: true, pdfPath: snap.data()?.pdfPath ?? null };
}

function serializeArticleDoc(id, data) {
  const createdAtMs = tsMs(data?.createdAt);
  return {
    id,
    title: typeof data?.title === "string" ? data.title : "",
    body: typeof data?.body === "string" ? data.body : "",
    excerpt: typeof data?.excerpt === "string" ? data.excerpt : "",
    pdfUrl: typeof data?.pdfUrl === "string" ? data.pdfUrl : null,
    fileName: typeof data?.fileName === "string" ? data.fileName : null,
    fileSize: typeof data?.fileSize === "number" ? data.fileSize : null,
    createdAtMs,
    createdAtLabel: relativeTime(createdAtMs),
    createdByEmail:
      typeof data?.createdByEmail === "string" ? data.createdByEmail : null,
  };
}
