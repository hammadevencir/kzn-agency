/**
 * Client-side image compression before uploading through our API routes.
 *
 * Production runs on Vercel serverless functions, which reject request bodies
 * over ~4.5 MB with a 413 before our route code runs. Phone screenshots and
 * camera photos are often bigger than that, so images are downscaled and
 * re-encoded as JPEG in the browser first. PDFs (and other documents) can't be
 * compressed here and are size-checked instead.
 *
 * The pure helpers (dimension math, file naming, type sniffing) are safe to
 * import anywhere; `compressImageFile` needs a browser (canvas).
 */

const MB = 1024 * 1024;

/** Hard cap for one file sent through a serverless function (keeps the multipart body < 4.5 MB). */
export const UPLOAD_MAX_FILE_BYTES = 4 * MB;
/** Size compressed images aim for. */
export const COMPRESS_TARGET_BYTES = 3.5 * MB;
/** Images at or below this size (and already PNG/JPEG/WEBP within max dimensions) are sent as-is. */
export const COMPRESS_SKIP_BELOW_BYTES = 1.5 * MB;
export const COMPRESS_MAX_DIMENSION = 2000;
export const COMPRESS_INITIAL_QUALITY = 0.82;
export const COMPRESS_MIN_QUALITY = 0.42;

export const PDF_TOO_LARGE_MESSAGE =
  "PDF is too large — max 4 MB. Send a screenshot instead or a smaller PDF.";
export const IMAGE_TOO_LARGE_MESSAGE =
  "Image is too large to upload (max 4 MB). Please send a smaller screenshot.";

const PASSTHROUGH_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
const DECODABLE_EXTENSIONS = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

/**
 * Best-effort MIME type (some mobile browsers send an empty `file.type`).
 * @param {{ type?: string, name?: string } | null | undefined} file
 */
export function guessFileType(file) {
  const t = String(file?.type || "").toLowerCase();
  if (t) return t === "image/jpg" ? "image/jpeg" : t;
  const ext = String(file?.name || "").toLowerCase().split(".").pop() || "";
  if (ext === "pdf") return "application/pdf";
  return DECODABLE_EXTENSIONS[ext] || "";
}

/** @param {{ type?: string, name?: string } | null | undefined} file */
export function isPdfFile(file) {
  return guessFileType(file) === "application/pdf";
}

/** Images we may be able to decode + re-encode in the browser. */
export function isCompressibleImage(file) {
  const t = guessFileType(file);
  return t.startsWith("image/") && t !== "image/svg+xml" && t !== "image/gif";
}

/**
 * Scale (w, h) so the long side is at most `maxDim`, keeping aspect ratio.
 * @param {number} width
 * @param {number} height
 * @param {number} [maxDim]
 * @returns {{ width: number, height: number }}
 */
export function fitWithin(width, height, maxDim = COMPRESS_MAX_DIMENSION) {
  const w = Math.max(1, Math.round(Number(width) || 1));
  const h = Math.max(1, Math.round(Number(height) || 1));
  const long = Math.max(w, h);
  if (long <= maxDim) return { width: w, height: h };
  const scale = maxDim / long;
  return {
    width: Math.max(1, Math.round(w * scale)),
    height: Math.max(1, Math.round(h * scale)),
  };
}

/**
 * Quality steps tried in order, from `start` down to `min` (inclusive-ish).
 * @param {number} [start]
 * @param {number} [min]
 * @param {number} [step]
 */
export function qualitySteps(
  start = COMPRESS_INITIAL_QUALITY,
  min = COMPRESS_MIN_QUALITY,
  step = 0.1
) {
  const out = [];
  for (let q = start; q >= min - 1e-9; q -= step) out.push(Math.round(q * 100) / 100);
  if (out.length === 0) out.push(min);
  return out;
}

/**
 * `photo.HEIC` → `photo.jpg`; names without an extension get one appended.
 * @param {string | undefined} name
 * @param {string} ext without the dot
 */
export function replaceExtension(name, ext) {
  const base = String(name || "").trim() || "image";
  const dot = base.lastIndexOf(".");
  const stem = dot > 0 ? base.slice(0, dot) : base;
  return `${stem}.${ext}`;
}

/** Human-readable size, e.g. 4.2 MB. */
export function formatBytes(bytes) {
  const n = Number(bytes) || 0;
  if (n >= MB) return `${(n / MB).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

/* ------------------------------------------------------------------ */
/* Browser-only part                                                   */
/* ------------------------------------------------------------------ */

/** @param {Blob} file */
async function decodeImage(file) {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close?.() };
    } catch {
      // Fall through to <img> decoding (e.g. HEIC on Safari, older browsers).
    }
  }
  if (typeof document === "undefined" || typeof URL === "undefined") return null;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode_failed"));
      el.src = url;
    });
    return {
      source: img,
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      close: () => {},
    };
  } catch {
    return null;
  } finally {
    // The decoded <img> keeps its pixels; the URL is no longer needed.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

/**
 * @param {CanvasImageSource} source
 * @param {number} width
 * @param {number} height
 * @param {number} quality
 * @returns {Promise<Blob | null>}
 */
async function renderJpeg(source, width, height, quality) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  // JPEG has no alpha — paint white so transparent PNG areas don't turn black.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);
  const blob = await new Promise((resolve) => {
    try {
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
    } catch {
      resolve(null);
    }
  });
  canvas.width = 0;
  canvas.height = 0;
  return blob;
}

/**
 * Downscale + re-encode an image as JPEG so it fits comfortably under the
 * serverless body limit. Returns the original file when it is not an image,
 * can't be decoded (e.g. HEIC in Chrome), or is already small enough.
 *
 * Never throws — callers still size-check the returned file.
 *
 * @param {File} file
 * @param {{
 *   maxDimension?: number,
 *   targetBytes?: number,
 *   skipBelowBytes?: number,
 *   initialQuality?: number,
 *   minQuality?: number,
 * }} [opts]
 * @returns {Promise<File>}
 */
export async function compressImageFile(file, opts = {}) {
  const {
    maxDimension = COMPRESS_MAX_DIMENSION,
    targetBytes = COMPRESS_TARGET_BYTES,
    skipBelowBytes = COMPRESS_SKIP_BELOW_BYTES,
    initialQuality = COMPRESS_INITIAL_QUALITY,
    minQuality = COMPRESS_MIN_QUALITY,
  } = opts;

  if (!file || !isCompressibleImage(file)) return file;
  const type = guessFileType(file);
  const passthroughType = PASSTHROUGH_IMAGE_TYPES.has(type);

  // Small PNG/JPEG/WEBP: send untouched (keeps PNG screenshots crisp).
  if (passthroughType && file.size <= skipBelowBytes) return file;

  let decoded;
  try {
    decoded = await decodeImage(file);
  } catch {
    decoded = null;
  }
  if (!decoded || !decoded.width || !decoded.height) return file;

  try {
    let { width, height } = fitWithin(decoded.width, decoded.height, maxDimension);
    const alreadyFits =
      passthroughType &&
      file.size <= targetBytes &&
      width === decoded.width &&
      height === decoded.height;
    if (alreadyFits) return file;

    /** @type {Blob | null} */
    let best = null;
    // Up to 3 rounds: walk quality down, then shrink dimensions and retry.
    for (let round = 0; round < 3; round++) {
      for (const q of qualitySteps(initialQuality, minQuality)) {
        const blob = await renderJpeg(decoded.source, width, height, q);
        if (!blob) break;
        if (!best || blob.size < best.size) best = blob;
        if (blob.size <= targetBytes) break;
      }
      if (best && best.size <= targetBytes) break;
      width = Math.max(1, Math.round(width * 0.75));
      height = Math.max(1, Math.round(height * 0.75));
    }

    if (!best) return file;
    // Re-encoding made it bigger and the original was already acceptable.
    if (passthroughType && best.size >= file.size && file.size <= targetBytes) return file;

    return new File([best], replaceExtension(file.name, "jpg"), {
      type: "image/jpeg",
      lastModified: file.lastModified || Date.now(),
    });
  } catch {
    return file;
  } finally {
    try {
      decoded.close();
    } catch {
      // ignore
    }
  }
}
