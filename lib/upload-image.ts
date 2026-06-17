/**
 * Client-side image upload orchestration.
 *
 * Combines:
 *   1. File validation (type + size)
 *   2. Client-side compression (lib/compress-image.ts)
 *   3. Cloudinary signed upload (calls getCloudinarySignature server action)
 *
 * Never imported from server code — this module imports browser-only utilities
 * via compress-image.ts (dynamic import) and calls a server action.
 */
import { getCloudinarySignature } from "@/actions/images";
import type { EditorialImage } from "@/types/image";

import { compressImage } from "./compress-image";

// ── Constants ───────────────────────────────────────────────────────────────

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_MB = 15;

// ── Validation ───────────────────────────────────────────────────────────────

/**
 * Returns a user-readable error string, or null if the file is acceptable.
 * Call before compression to give fast feedback without doing any work.
 */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "รองรับเฉพาะไฟล์ JPEG, PNG และ WEBP เท่านั้น";
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `ไฟล์ต้องมีขนาดไม่เกิน ${MAX_FILE_SIZE_MB} MB`;
  }
  return null;
}

// ── Upload ───────────────────────────────────────────────────────────────────

/**
 * Full upload pipeline: validate → compress → sign → upload to Cloudinary.
 *
 * Returns an EditorialImage on success.
 * Throws a plain Error with a user-readable message on any failure.
 *
 * @param file  Raw file from a file input or drag-drop event.
 * @param alt   Alt text for the image (required for accessibility).
 */
export async function uploadEditorialImage(
  file: File,
  alt: string,
): Promise<EditorialImage> {
  // 1 — Compress / resize before sending to Cloudinary.
  let compressed: File;
  try {
    compressed = await compressImage(file);
  } catch {
    throw new Error("การบีบอัดรูปล้มเหลว โปรดลองอีกครั้ง");
  }

  // 2 — Fetch a signed upload token from the server.
  const sigData = await getCloudinarySignature();
  if ("error" in sigData) {
    throw new Error(sigData.error);
  }

  // 3 — Upload directly to Cloudinary's REST API.
  //     The API secret never leaves the server — only the signature is used here.
  const formData = new FormData();
  formData.append("file", compressed);
  formData.append("api_key", sigData.apiKey);
  formData.append("timestamp", String(sigData.timestamp));
  formData.append("signature", sigData.signature);
  formData.append("folder", sigData.folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
    { method: "POST", body: formData },
  );

  if (!res.ok) {
    let message = "อัพโหลดไม่สำเร็จ โปรดลองอีกครั้ง";
    try {
      const err = await res.json();
      if (err?.error?.message) message = err.error.message;
    } catch {
      /* ignore parse error */
    }
    throw new Error(message);
  }

  // 4 — Parse Cloudinary response and return EditorialImage.
  const data = await res.json();

  return {
    url: data.secure_url as string,
    alt,
    width: data.width as number,
    height: data.height as number,
    focalX: 0.5,
    focalY: 0.5,
    publicId: data.public_id as string,
  };
}
