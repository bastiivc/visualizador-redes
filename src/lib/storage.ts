import fs from "fs";
import path from "path";
import zlib from "zlib";

// Local storage directory
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || "redes-files";

function isSupabaseConfigured(): boolean {
  return typeof SUPABASE_URL === "string" && SUPABASE_URL.startsWith("http") && typeof SUPABASE_SERVICE_KEY === "string";
}

function ensureUploadsDirExists() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

/**
 * Saves a file to Supabase Storage or persistent local storage.
 * Automatically compresses HTML and large files using Gzip (level 9).
 * Returns the storageKey stored in DB.
 */
export async function saveStorageFile(
  fileId: string,
  extension: string,
  buffer: Buffer
): Promise<{ storageKey: string; fileSizeBytes: number }> {
  const safeExt = extension.startsWith(".") ? extension : `.${extension}`;

  // Compress HTML or files larger than 256KB with Gzip
  let finalBuffer = buffer;
  let isCompressed = false;
  if (safeExt === ".html" || buffer.length > 256 * 1024) {
    try {
      finalBuffer = zlib.gzipSync(buffer, { level: 9 });
      isCompressed = true;
    } catch (err) {
      console.warn("Gzip compression failed, saving raw buffer:", err);
    }
  }

  const filename = isCompressed ? `${fileId}${safeExt}.gz` : `${fileId}${safeExt}`;
  const fileSizeBytes = finalBuffer.length;

  if (isSupabaseConfigured()) {
    try {
      const contentType = safeExt === ".png" ? "image/png" : "text/html; charset=utf-8";
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${filename}`;

      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": contentType,
          "x-upsert": "true",
        },
        body: new Uint8Array(finalBuffer),
      });

      if (res.ok) {
        return { storageKey: filename, fileSizeBytes };
      } else {
        const errText = await res.text();
        console.warn("Supabase Storage upload failed, falling back to local disk:", errText);
      }
    } catch (err) {
      console.warn("Supabase Storage error, using local fallback:", err);
    }
  }

  ensureUploadsDirExists();
  const filePath = path.join(UPLOADS_DIR, filename);
  await fs.promises.writeFile(filePath, finalBuffer);

  return {
    storageKey: filename,
    fileSizeBytes,
  };
}

/**
 * Returns a file buffer from Supabase Storage or local storage.
 */
export async function getStorageFileBuffer(storageKey: string): Promise<Buffer | null> {
  if (isSupabaseConfigured()) {
    try {
      const downloadUrl = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${storageKey}`;
      const res = await fetch(downloadUrl);

      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
    } catch (err) {
      console.warn("Error reading from Supabase Storage, checking local fallback:", err);
    }
  }

  const filePath = path.join(UPLOADS_DIR, storageKey);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return await fs.promises.readFile(filePath);
}

/**
 * Deletes a file from Supabase Storage or local storage.
 */
export async function deleteStorageFile(storageKey: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      const deleteUrl = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${storageKey}`;
      await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      });
    } catch (err) {
      console.warn("Failed to delete file from Supabase Storage:", err);
    }
  }

  try {
    const filePath = path.join(UPLOADS_DIR, storageKey);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
  } catch (err) {
    console.warn("Failed to delete local storage file:", err);
  }
  return true;
}
