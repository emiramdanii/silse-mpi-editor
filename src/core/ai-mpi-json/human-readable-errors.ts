/**
 * Human-Readable Error Translator (UX-01).
 *
 * Layer: core/ai-mpi-json (pure function, no React/DOM)
 *
 * Kontrak:
 *   Translate technical validator errors into Bahasa Indonesia yang ramah guru.
 *   "must be object" → "Format data tidak sesuai (harus berupa objek)"
 *   "must be string" → "Nilai harus berupa teks"
 *
 *   Prinsip:
 *     - Pure function, no DOM, no React.
 *     - Non-blocking: only translates, doesn't validate.
 *     - Guru-friendly: hindari jargon teknis.
 */

export type HumanReadableError = {
  field: string;
  message: string;
  /** Saran perbaikan untuk guru */
  suggestion?: string;
};

/**
 * Map technical error path + message to human-readable Bahasa Indonesia.
 */
export function translateError(path: string, technicalMessage: string): HumanReadableError {
  // Common patterns
  const translations: Array<{ pattern: RegExp; message: string; suggestion?: string }> = [
    { pattern: /^must be object$/, message: 'Format data tidak sesuai (harus berupa objek JSON).', suggestion: 'Pastikan format menggunakan { kurung kurawal }' },
    { pattern: /^must be string$/, message: 'Nilai harus berupa teks.', suggestion: 'Gunakan tanda kutip "..." untuk teks' },
    { pattern: /^must be number$/, message: 'Nilai harus berupa angka.', suggestion: 'Gunakan angka tanpa tanda kutip, contoh: 1' },
    { pattern: /^must be array$/, message: 'Nilai harus berupa daftar (array).', suggestion: 'Gunakan [ kurung siku ] untuk daftar' },
    { pattern: /^must be non-empty array$/, message: 'Daftar scene tidak boleh kosong.', suggestion: 'Tambahkan minimal 1 scene (halaman)' },
    { pattern: /^must have steps array$/, message: 'Alur pembelajaran (flow) harus punya langkah-langkah.', suggestion: 'Tambahkan flow.steps dengan daftar sceneId' },
    { pattern: /^must be object \(bukan flat\)$/, message: 'Format style harus berupa objek, bukan teks biasa.', suggestion: 'Gunakan { "styleId": "modern-clean" } bukan "modern-clean"' },
    { pattern: /^unknown sceneType/, message: 'Jenis halaman tidak dikenali.', suggestion: 'Gunakan jenis halaman yang tersedia di prompt (misal: cover-hero, quiz-challenge)' },
    { pattern: /^unknown content kind/, message: 'Jenis konten tidak dikenali.', suggestion: 'Gunakan jenis konten yang tersedia di prompt (misal: learning-material, quiz-question)' },
    { pattern: /^scene\.slots must be non-empty array$/, message: 'Setiap halaman harus punya minimal 1 slot konten.', suggestion: 'Tambahkan slots dengan minimal 1 elemen' },
  ];

  for (const t of translations) {
    if (t.pattern.test(technicalMessage)) {
      return { field: path, message: t.message, suggestion: t.suggestion };
    }
  }

  // Fallback: return original message with generic prefix
  return {
    field: path,
    message: `Format tidak sesuai: ${technicalMessage}`,
    suggestion: 'Periksa kembali struktur JSON Anda',
  };
}

/**
 * Translate array of technical errors to human-readable.
 */
export function translateErrors(errors: Array<{ path: string; message: string }>): HumanReadableError[] {
  return errors.map((e) => translateError(e.path, e.message));
}

/**
 * Format human-readable errors for display.
 * Returns array of formatted strings with suggestion (if available).
 */
export function formatHumanReadableErrors(errors: HumanReadableError[]): string[] {
  return errors.map((e) => {
    let text = e.message;
    if (e.field && e.field !== 'root') {
      text = `[${e.field}] ${text}`;
    }
    if (e.suggestion) {
      text += ` → ${e.suggestion}`;
    }
    return text;
  });
}
