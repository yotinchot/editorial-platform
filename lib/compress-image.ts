/**
 * Client-side image compression utility.
 *
 * Uses `browser-image-compression` via dynamic import so it is never
 * executed during SSR (the package requires browser APIs).
 *
 * Targets:
 *   - Max 1.5 MB after compression
 *   - Max 2400 px on the longest axis (preserves retina editorial quality)
 *   - Web worker off-thread so typing is not blocked during compression
 *
 * Throws if compression fails — callers should handle the error.
 */
export async function compressImage(file: File): Promise<File> {
  const { default: imageCompression } = await import("browser-image-compression");

  return imageCompression(file, {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 2400,
    useWebWorker: true,
    // Preserve the original file type (JPEG quality ~85, PNG lossless resize).
    fileType: file.type,
  });
}
