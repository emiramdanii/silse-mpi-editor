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

// ---------------------------------------------------------------------------
// V2-PILAR-2.5: Client-Side Color Thief — extract dominant color from PNG
// ---------------------------------------------------------------------------

/**
 * Ekstrak warna dominan dari gambar (data URL) menggunakan canvas sampling.
 *
 * Mekanisme:
 *   1. Load dataUrl ke Image()
 *   2. Draw ke canvas 10x10 (downscale untuk sampling cepat)
 *   3. getImageData → rata-rata RGB semua pixel
 *   4. Konversi ke HEX string (#RRGGBB)
 *
 * Pure browser function (butuh Image + canvas). Di jsdom, Image tidak
 * benar-benar load gambar — return null di test environment.
 *
 * @param dataUrl Data URL gambar (data:image/png;base64,...)
 * @returns HEX string #RRGGBB atau null jika gagal
 */
export function extractDominantColor(dataUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    // Check if we're in a browser with canvas support
    if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
      resolve(null);
      return;
    }
    // Timeout fallback: if image doesn't load in 3s, resolve null
    // (prevents hanging in jsdom where Image events may not fire)
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    }, 3000);
    const img = new Image();
    img.onload = () => {
      if (resolved) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 10;
        canvas.height = 10;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolved = true;
          clearTimeout(timeout);
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, 10, 10);
        const imageData = ctx.getImageData(0, 0, 10, 10);
        const pixels = imageData.data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < pixels.length; i += 4) {
          // Skip fully transparent pixels
          if (pixels[i + 3] < 128) continue;
          r += pixels[i];
          g += pixels[i + 1];
          b += pixels[i + 2];
          count++;
        }
        if (count === 0) {
          resolved = true;
          clearTimeout(timeout);
          resolve(null);
          return;
        }
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
        resolved = true;
        clearTimeout(timeout);
        resolve(hex);
      } catch {
        resolved = true;
        clearTimeout(timeout);
        resolve(null);
      }
    };
    img.onerror = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      resolve(null);
    };
    img.src = dataUrl;
  });
}

/**
 * Hitung relative luminance dari HEX color.
 * Uses WCAG 2.1 formula: L = 0.2126*R + 0.7152*G + 0.0722*B
 * where R/G/B are gamma-corrected (0-1).
 *
 * @param hex HEX string (#RRGGBB)
 * @returns luminance 0-1 (0 = darkest, 1 = lightest)
 */
export function hexLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return 0.5;
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  // Gamma correction
  const gamma = (v: number) => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  return 0.2126 * gamma(r) + 0.7152 * gamma(g) + 0.0722 * gamma(b);
}

/**
 * Tentukan warna teks yang kontras dengan background.
 *
 * Logika (sesuai arahan Bapak):
 *   - Luminance > 0.5 (TERANG) → suggest warna GELAP (#1f2937)
 *   - Luminance <= 0.5 (GELAP) → suggest warna TERANG (#ffffff)
 *
 * @param bgHex HEX background color
 * @returns HEX text color yang kontras
 */
export function contrastTextColor(bgHex: string): string {
  const lum = hexLuminance(bgHex);
  return lum > 0.5 ? '#1f2937' : '#ffffff';
}

/**
 * Batch extract dominant colors dengan concurrency limit.
 *
 * @param dataUrls Array data URL gambar
 * @param concurrency Maksimal ekstraksi paralel (default 5)
 * @returns Array HEX string (atau null per item jika gagal)
 */
export async function batchExtractDominantColors(
  dataUrls: string[],
  concurrency: number = 5,
): Promise<(string | null)[]> {
  const results: (string | null)[] = new Array(dataUrls.length).fill(null);
  let nextIndex = 0;

  async function processNext(): Promise<void> {
    while (nextIndex < dataUrls.length) {
      const idx = nextIndex++;
      results[idx] = await extractDominantColor(dataUrls[idx]);
    }
  }

  // Start concurrency workers
  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(concurrency, dataUrls.length); i++) {
    workers.push(processNext());
  }
  await Promise.all(workers);
  return results;
}
