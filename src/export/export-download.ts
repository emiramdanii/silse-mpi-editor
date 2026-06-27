/**
 * Export download helper.
 *
 * Layer: export
 * Allowed imports: (browser API only — Blob, URL.createObjectURL)
 *
 * Triggers a browser download of the exported HTML file.
 */

/**
 * Download a string as an HTML file.
 * @param filename - target filename (without extension, will be sanitized)
 * @param html - HTML content string
 */
export function downloadHtmlFile(filename: string, html: string): void {
  // Sanitize filename: remove unsafe characters, add .html extension
  const safeName = sanitizeFilename(filename);
  const fullFilename = `${safeName}.html`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fullFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Cleanup
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Sanitize a string for use as a filename.
 * Removes: path separators, special chars, control chars.
 * Keeps: alphanumeric, spaces, hyphens, underscores.
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // remove unsafe chars
    .replace(/\s+/g, '_') // spaces to underscores
    .replace(/_+/g, '_') // collapse multiple underscores
    .replace(/^_+|_+$/g, '') // trim leading/trailing underscores
    .slice(0, 100) // limit length
    || 'mpi-export'; // fallback if empty
}
