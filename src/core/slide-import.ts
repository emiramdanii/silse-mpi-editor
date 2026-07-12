/**
 * @module slide-import
 *
 * V2-PILAR-1: Helpers for importing slide images (PNG/JPEG/WebP) as project pages.
 *
 * Layer: core (pure functions, no React/DOM except FileReader which is browser-only)
 *
 * Dipakai oleh:
 *   - Topbar.tsx (handler tombol "Impor Slide PNG")
 *   - editor-store.ts (importSlidesAsPages consumer)
 *
 * Pure helpers (testable tanpa DOM):
 *   - isAcceptedImageFile(fileName): boolean
 *   - MAX_SLIDE_FILES, validateSlideFileCount(files): { ok, error? }
 *
 * Browser-only helpers (testable dengan jsdom):
 *   - readImageFileAsDataUrl(file: File): Promise<string>
 *   - readImageFiles(files: File[]): Promise<Array<{ name: string; dataUrl: string }>>
 */

/** Ekstensi file yang didukung untuk impor slide. */
export const ACCEPTED_SLIDE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'] as const;

/** MIME types yang didukung (untuk <input accept="...">). */
export const ACCEPTED_SLIDE_MIME = 'image/png,image/jpeg,image/webp';

/** Label untuk UI: "File Gambar (PNG, JPG, WebP)". */
export const SLIDE_FILE_LABEL = 'File Gambar (PNG, JPG, WebP)';

/** Maksimum file per sesi impor. */
export const MAX_SLIDE_FILES = 50;

/**
 * Cek apakah fileName punya ekstensi yang didukung.
 * Case-insensitive.
 */
export function isAcceptedImageFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return ACCEPTED_SLIDE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Validasi jumlah file untuk impor.
 * Returns { ok: true } jika valid, { ok: false, error } jika tidak.
 */
export function validateSlideFileCount(
  count: number,
): { ok: true } | { ok: false; error: string } {
  if (count === 0) {
    return { ok: false, error: 'Tidak ada file dipilih.' };
  }
  if (count > MAX_SLIDE_FILES) {
    return {
      ok: false,
      error: `Maksimum ${MAX_SLIDE_FILES} file per sesi impor. Anda memilih ${count} file. Kurangi pilihan dan coba lagi.`,
    };
  }
  return { ok: true };
}

/**
 * Baca satu File sebagai data URL (base64).
 * Browser-only (FileReader). Di jsdom, FileReader polyfill tersedia.
 */
export function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error(`Failed to read ${file.name} as data URL`));
      }
    };
    reader.onerror = () => reject(new Error(`FileReader error on ${file.name}`));
    reader.readAsDataURL(file);
  });
}

/**
 * Baca banyak File sebagai data URL secara paralel.
 * Skip file dengan ekstensi tidak didukung (jangan reject semua batch).
 * Return array of { name, dataUrl }.
 *
 * Browser-only (FileReader via readImageFileAsDataUrl).
 */
export async function readImageFiles(
  files: File[],
): Promise<Array<{ name: string; dataUrl: string }>> {
  const accepted = files.filter((f) => isAcceptedImageFile(f.name));
  const results = await Promise.all(
    accepted.map(async (f) => ({
      name: f.name,
      dataUrl: await readImageFileAsDataUrl(f),
    })),
  );
  return results;
}
