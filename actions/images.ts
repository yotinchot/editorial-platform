"use server";

import { v2 as cloudinary } from "cloudinary";
import { redirect } from "next/navigation";

import { getSessionToken } from "@/lib/auth/cookies";
import { verifySession } from "@/lib/auth/session";

// ── Auth guard ──────────────────────────────────────────────────────────────

async function requireAuth(): Promise<void> {
  const token = await getSessionToken();
  if (!token || !(await verifySession(token))) {
    redirect("/admin/login");
  }
}

// ── Allowed upload folders ──────────────────────────────────────────────────

// Restricts uploads to known safe paths. Add here when new contexts need
// their own Cloudinary folders.
const ALLOWED_FOLDERS = ["editorial-platform/posts"] as const;
type AllowedFolder = (typeof ALLOWED_FOLDERS)[number];

// ── getCloudinarySignature ──────────────────────────────────────────────────

/**
 * Generate a signed upload token for direct client → Cloudinary uploads.
 *
 * Security contract:
 *   - Requires a valid admin session.
 *   - Validates the requested folder against the ALLOWED_FOLDERS allowlist.
 *   - Never returns CLOUDINARY_API_SECRET to the client.
 *   - The signature expires after ~1 hour (Cloudinary's server-side window).
 *
 * Client upload flow:
 *   1. Call this action to get { signature, timestamp, apiKey, cloudName, folder }
 *   2. POST to https://api.cloudinary.com/v1_1/{cloudName}/image/upload
 *      with the file + these params in FormData.
 *   3. Cloudinary validates the signature and returns { secure_url, width, height, public_id }.
 */
export async function getCloudinarySignature(
  folder: string = "editorial-platform/posts",
): Promise<
  | {
      signature: string;
      timestamp: number;
      apiKey: string;
      cloudName: string;
      folder: string;
    }
  | { error: string }
> {
  await requireAuth();

  // Validate folder against allowlist.
  if (!ALLOWED_FOLDERS.includes(folder as AllowedFolder)) {
    return { error: "Invalid upload folder." };
  }

  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  if (!apiSecret || !apiKey || !cloudName) {
    console.error("[getCloudinarySignature] Missing Cloudinary environment variables.");
    return { error: "Image uploads are not configured. Please contact the site administrator." };
  }

  const timestamp = Math.round(Date.now() / 1000);

  // cloudinary.utils.api_sign_request is a synchronous crypto operation —
  // no network call, nothing is sent to Cloudinary at this point.
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp },
    apiSecret,
  );

  return { signature, timestamp, apiKey, cloudName, folder };
}
