/**
 * AiImportDialog — V1 AI Design Import Contract.
 *
 * Modal untuk import desain dari AI ke SILSE editor.
 * Flow:
 *   Tab 1 "Copy Prompt" → guru copy prompt ke AI (Claude/ChatGPT) → dapat JSON
 *   Tab 2 "Paste JSON" → guru paste JSON → validate → apply ke editor
 *
 * AI menghasilkan Blueprint JSON (sesuai schema), BUKAN HTML bebas.
 * Editor membaca blueprint 100%, guru edit, export HTML.
 *
 * Kontrak: AI → Blueprint JSON → Editor → Export HTML.
 */

import { useState, useMemo } from 'react';
import { useEditorStore } from '../store/editor-store';
import { buildMpiPromptText } from '../core/ai-prompt-contract/buildMpiPromptContract';
import { validateAiMpiJson } from '../core/ai-mpi-json/validateAiMpiJson';
import { normalizeAiMpiJson } from '../core/ai-mpi-json/normalizeAiMpiJson';
import { aiBlueprintToSimpleProject } from '../core/ai-mpi-json/aiBlueprintToSimpleProject';
import { checkBlueprintContentQuality } from '../core/content-quality-guard';
import { collectImportWarnings, formatImportWarnings } from '../core/ai-mpi-json/silent-failure-handler';
import { translateErrors, formatHumanReadableErrors } from '../core/ai-mpi-json/human-readable-errors';
import type { BlueprintValidationError } from '../core/ai-mpi-json/validateAiMpiJson';

type Tab = 'prompt' | 'import';

/**
 * Robust JSON cleanup: removes markdown code blocks, extracts JSON from
 * strings with extra text/preamble (common AI output issues).
 * (from Qwen PR — cherry-picked)
 */
function cleanJsonInput(raw: string): string {
  let cleaned = raw.trim();
  // Remove markdown code blocks
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  // Extract JSON object from string with extra text
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }
  return cleaned;
}

export function AiImportDialog({ onClose }: { onClose: () => void }) {
  const setProject = useEditorStore((s) => s.setProject);
  const currentProject = useEditorStore((s) => s.project);

  const [tab, setTab] = useState<Tab>('prompt');
  const [jsonInput, setJsonInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<BlueprintValidationError[] | null>(null);
  const [qualityWarnings, setQualityWarnings] = useState<string[]>([]);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [applied, setApplied] = useState(false);

  const promptText = useMemo(() => buildMpiPromptText(), []);

  const hasExistingContent = currentProject.pages.some(
    (p) => p.components.length > 0 || p.sceneType,
  );

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
      const ta = document.getElementById('ai-prompt-text') as HTMLTextAreaElement;
      if (ta) {
        ta.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleValidate = () => {
    setApplied(false);
    setQualityWarnings([]);
    setImportWarnings([]);
    if (!jsonInput.trim()) {
      setErrors([{ message: 'JSON tidak boleh kosong. Paste hasil JSON dari AI.' } as BlueprintValidationError]);
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleanJsonInput(jsonInput));
    } catch (e) {
      setErrors([{ message: `JSON tidak valid: ${(e as Error).message}. Pastikan Anda paste JSON murni tanpa teks tambahan.` } as BlueprintValidationError]);
      return;
    }

    const validationErrors = validateAiMpiJson(parsed);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors(null);

    // C-03: Collect import warnings (silent failure handler)
    const warnings = collectImportWarnings(parsed);
    setImportWarnings(formatImportWarnings(warnings));

    // Validasi content quality (warning, bukan blocker)
    try {
      const normalized = normalizeAiMpiJson(parsed);
      const project = aiBlueprintToSimpleProject(normalized);
      const quality = checkBlueprintContentQuality(normalized);
      if (quality.errors.length > 0) {
        setQualityWarnings(quality.errors.map((e) => e.message));
      } else {
        setQualityWarnings([]);
      }
      // Simpan untuk apply
      void project;
    } catch (e) {
      setErrors([{ message: `Gagal memproses blueprint: ${(e as Error).message}` } as BlueprintValidationError]);
    }
  };

  const handleApply = () => {
    if (!jsonInput.trim()) return;
    try {
      const parsed = JSON.parse(cleanJsonInput(jsonInput));
      const validationErrors = validateAiMpiJson(parsed);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }
      const normalized = normalizeAiMpiJson(parsed);
      const project = aiBlueprintToSimpleProject(normalized);
      setProject(project);
      setApplied(true);
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (e) {
      setErrors([{ message: `Gagal menerapkan: ${(e as Error).message}` } as BlueprintValidationError]);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
        display: 'grid', placeItems: 'center', padding: 16,
      }}
      data-testid="ai-import-dialog"
    >
      <div
        style={{
          background: 'var(--color-panel)', borderRadius: 16, maxWidth: 800, width: '100%',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.24)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border-neutral)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: 20, fontWeight: 800, color: 'var(--color-text-strong)' }}>
              🤖 Import Desain dari AI
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-muted)' }}>
              AI buat blueprint JSON → masuk ke editor → edit → export HTML
            </p>
          </div>
          <button
            data-testid="ai-import-close"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--color-muted)', padding: '0 4px' }}
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '12px 24px 0', borderBottom: '1px solid var(--color-border-neutral)' }}>
          <button
            data-testid="ai-import-tab-prompt"
            onClick={() => setTab('prompt')}
            style={{
              padding: '8px 16px', border: 'none', background: tab === 'prompt' ? 'var(--color-accent)' : 'transparent',
              color: tab === 'prompt' ? 'var(--color-panel)' : 'var(--color-muted)', borderRadius: '8px 8px 0 0',
              cursor: 'pointer', fontSize: 13, fontWeight: 700,
            }}
          >
            1. Copy Prompt
          </button>
          <button
            data-testid="ai-import-tab-import"
            onClick={() => setTab('import')}
            style={{
              padding: '8px 16px', border: 'none', background: tab === 'import' ? 'var(--color-accent)' : 'transparent',
              color: tab === 'import' ? 'var(--color-panel)' : 'var(--color-muted)', borderRadius: '8px 8px 0 0',
              cursor: 'pointer', fontSize: 13, fontWeight: 700,
            }}
          >
            2. Paste JSON dari AI
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {tab === 'prompt' && (
            <div data-testid="ai-import-prompt-panel">
              <div style={{ background: 'var(--color-accent-soft)', border: '1px solid var(--color-accent)', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 13, color: 'var(--color-accent-hover)' }}>
                <strong>Cara pakai:</strong>
                <ol style={{ margin: '6px 0 0 16px', padding: 0, lineHeight: 1.6 }}>
                  <li>Copy prompt di bawah ini</li>
                  <li>Buka AI (Claude, ChatGPT, Gemini)</li>
                  <li>Paste prompt + tambahkan topik Anda (mis: "Buat MPI tentang fotosintesis")</li>
                  <li>AI akan menghasilkan JSON — copy JSON itu</li>
                  <li>Kembali ke sini, klik tab "Paste JSON dari AI"</li>
                </ol>
              </div>
              <textarea
                id="ai-prompt-text"
                data-testid="ai-prompt-text"
                readOnly
                value={promptText}
                style={{
                  width: '100%', minHeight: 280, padding: 12,
                  border: '1px solid var(--color-border-strong)', borderRadius: 8,
                  fontFamily: 'ui-monospace, monospace', fontSize: 12, lineHeight: 1.5,
                  resize: 'vertical', boxSizing: 'border-box', background: 'var(--color-panel-soft)',
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  data-testid="ai-import-copy-prompt"
                  onClick={handleCopyPrompt}
                  style={{
                    padding: '8px 20px', background: copied ? 'var(--color-success-strong)' : 'var(--color-accent)',
                    color: 'var(--color-panel)', border: 'none', borderRadius: 8,
                    cursor: 'pointer', fontSize: 13, fontWeight: 700,
                  }}
                >
                  {copied ? '✓ Tersalin!' : '📋 Copy Prompt'}
                </button>
                <button
                  data-testid="ai-import-goto-import"
                  onClick={() => setTab('import')}
                  style={{
                    padding: '8px 20px', background: 'var(--color-panel)', color: 'var(--color-accent)',
                    border: '1px solid var(--color-accent)', borderRadius: 8,
                    cursor: 'pointer', fontSize: 13, fontWeight: 700,
                  }}
                >
                  Saya sudah dapat JSON →
                </button>
              </div>
            </div>
          )}

          {tab === 'import' && (
            <div data-testid="ai-import-json-panel">
              {hasExistingContent && (
                <div style={{ background: 'var(--color-warning-soft)', border: '1px solid var(--color-warning-strong)', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 12, color: 'var(--color-warning-deep)' }}>
                  ⚠️ Project saat ini sudah berisi konten. Import akan menggantinya.
                </div>
              )}
              <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-strong)', display: 'block', marginBottom: 6 }}>
                Paste JSON dari AI:
              </label>
              <textarea
                data-testid="ai-import-json-input"
                value={jsonInput}
                onChange={(e) => { setJsonInput(e.target.value); setErrors(null); setQualityWarnings([]); setApplied(false); }}
                placeholder='{\n  "version": 1,\n  "metadata": { "title": "..." },\n  "scenes": [...]\n}'
                style={{
                  width: '100%', minHeight: 240, padding: 12,
                  border: '1px solid var(--color-border-strong)', borderRadius: 8,
                  fontFamily: 'ui-monospace, monospace', fontSize: 12, lineHeight: 1.5,
                  resize: 'vertical', boxSizing: 'border-box',
                }}
              />

              {errors && errors.length > 0 && (
                <div data-testid="ai-import-errors" style={{ background: 'var(--color-danger-soft)', border: '1px solid var(--color-danger-strong)', borderRadius: 8, padding: 12, marginTop: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-danger-deep)', marginBottom: 6 }}>❌ Ada masalah dengan JSON dari AI:</div>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--color-danger-deep)', lineHeight: 1.6 }}>
                    {formatHumanReadableErrors(translateErrors(errors)).map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}

              {errors === null && jsonInput.trim() && importWarnings.length > 0 && (
                <div data-testid="ai-import-silent-warnings" style={{ background: 'var(--color-warning-soft)', border: '1px solid var(--color-warning-strong)', borderRadius: 8, padding: 12, marginTop: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-warning-deep)', marginBottom: 6 }}>⚠️ Elemen tidak dikenali (tetap bisa diapply):</div>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--color-warning-deep)', lineHeight: 1.6 }}>
                    {importWarnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {errors === null && jsonInput.trim() && qualityWarnings.length > 0 && (
                <div data-testid="ai-import-warnings" style={{ background: 'var(--color-warning-soft)', border: '1px solid var(--color-warning-strong)', borderRadius: 8, padding: 12, marginTop: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-warning-deep)', marginBottom: 6 }}>⚠️ Catatan kualitas (tetap bisa diapply):</div>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--color-warning-deep)', lineHeight: 1.6 }}>
                    {qualityWarnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {applied && (
                <div data-testid="ai-import-success" style={{ background: 'var(--color-success-soft)', border: '1px solid var(--color-success-strong)', borderRadius: 8, padding: 12, marginTop: 12, fontSize: 13, color: 'var(--color-success-deep)', fontWeight: 700 }}>
                  ✓ Desain AI berhasil dimuat! Menutup dialog...
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  data-testid="ai-import-validate"
                  onClick={handleValidate}
                  style={{
                    padding: '8px 20px', background: 'var(--color-panel)', color: 'var(--color-accent)',
                    border: '1px solid var(--color-accent)', borderRadius: 8,
                    cursor: 'pointer', fontSize: 13, fontWeight: 700,
                  }}
                >
                  🔍 Validasi
                </button>
                <button
                  data-testid="ai-import-apply"
                  onClick={handleApply}
                  disabled={!jsonInput.trim() || applied}
                  style={{
                    padding: '8px 20px', background: jsonInput.trim() && !applied ? 'var(--color-success-strong)' : 'var(--color-border-strong)',
                    color: 'var(--color-panel)', border: 'none', borderRadius: 8,
                    cursor: jsonInput.trim() && !applied ? 'pointer' : 'not-allowed',
                    fontSize: 13, fontWeight: 700,
                  }}
                >
                  {applied ? '✓ Diterapkan' : '→ Terapkan ke Editor'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
