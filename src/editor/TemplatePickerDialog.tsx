/**
 * TemplatePickerDialog — TEMPLATE-PEDAGOGIS-READY-02 PATCH A
 *
 * Modal untuk pilih template pedagogis siap pakai.
 * Guru pilih template → generate MPI dengan scene dinamis → load ke editor.
 * Scene count per template: PPKn=17, IPA=14, MTK=14 (TEACHER-READY-TEMPLATE-QUALITY-01).
 *
 * PATCH A: overwrite guard + premium UI polish + 16:9 fit.
 */

import { useState, useEffect, useCallback } from 'react';
import { useEditorStore } from '../store/editor-store';
import {
  PEDAGOGICAL_TEMPLATES,
  getUniqueTemplateMapelList,
  getTemplatesByMapel,
  templateToBlueprint,
  type PedagogicalTemplate,
} from '../core/guided-flow/pedagogical-templates';
import { aiBlueprintToSimpleProject, validateAiMpiJson } from '../core/ai-mpi-json';
import { checkBlueprintContentQuality } from '../core/content-quality-guard';
import { listCustomTemplates, loadCustomTemplate, deleteCustomTemplate, type CustomTemplateEntry } from '../storage/template-storage';

export function TemplatePickerDialog({ onClose }: { onClose: () => void }) {
  const setProject = useEditorStore((s) => s.setProject);
  const currentProject = useEditorStore((s) => s.project);
  const [selectedMapel, setSelectedMapel] = useState<string>('all');
  const [applied, setApplied] = useState(false);
  const [confirmOverwrite, setConfirmOverwrite] = useState<PedagogicalTemplate | null>(null);
  // L5-2: Custom templates
  const [customTemplates, setCustomTemplates] = useState<CustomTemplateEntry[]>([]);
  const [confirmCustomOverwrite, setConfirmCustomOverwrite] = useState<string | null>(null);
  const [confirmDeleteTemplate, setConfirmDeleteTemplate] = useState<string | null>(null);

  const refreshCustomTemplates = useCallback(() => {
    setCustomTemplates(listCustomTemplates());
  }, []);

  useEffect(() => {
    refreshCustomTemplates();
  }, [refreshCustomTemplates]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const mapelList = ['all', ...getUniqueTemplateMapelList()];
  const templates = selectedMapel === 'all' ? PEDAGOGICAL_TEMPLATES : getTemplatesByMapel(selectedMapel);

  const hasExistingContent = (currentProject.pages.length > 1) ||
    currentProject.pages.some((p) => p.components.length > 0 || p.sceneType);

  const doApply = (template: PedagogicalTemplate) => {
    const bp = templateToBlueprint(template);
    const project = aiBlueprintToSimpleProject(bp);
    project.currentPageId = project.pages[0]?.id ?? '';
    setProject(project);
    setApplied(true);
    setConfirmOverwrite(null);
    setTimeout(() => onClose(), 400);
  };

  const handleApply = (template: PedagogicalTemplate) => {
    if (hasExistingContent) {
      setConfirmOverwrite(template);
    } else {
      doApply(template);
    }
  };

  // L5-2: Custom template handlers
  const doApplyCustom = (templateId: string) => {
    const result = loadCustomTemplate(templateId);
    if (result.ok && result.data) {
      result.data.currentPageId = result.data.pages[0]?.id ?? '';
      setProject(result.data);
      setApplied(true);
      setConfirmCustomOverwrite(null);
      setTimeout(() => onClose(), 400);
    }
  };

  const handleApplyCustom = (templateId: string) => {
    if (hasExistingContent) {
      setConfirmCustomOverwrite(templateId);
    } else {
      doApplyCustom(templateId);
    }
  };

  const handleDeleteCustom = (templateId: string) => {
    deleteCustomTemplate(templateId);
    setConfirmDeleteTemplate(null);
    refreshCustomTemplates();
  };

  const getQualityStatus = (template: PedagogicalTemplate) => {
    const bp = templateToBlueprint(template);
    const validationErrors = validateAiMpiJson(bp);
    const qualityResult = checkBlueprintContentQuality(bp);
    return {
      valid: validationErrors.length === 0,
      qualityPass: qualityResult.errors.length === 0,
      sceneCount: bp.scenes.length,
      hasCover: bp.scenes[0]?.sceneType === 'cover-hero',
      hasClosing: bp.scenes[bp.scenes.length - 1]?.sceneType === 'closing-award',
    };
  };

  const getGameType = (template: PedagogicalTemplate): string => {
    const gameScene = template.scenes.find((s) =>
      ['classification-game', 'matching-game', 'sequencing-game', 'game-mission'].includes(s.sceneType)
    );
    if (!gameScene) return '';
    const labels: Record<string, string> = {
      'classification-game': '🎮 Game Sortir',
      'matching-game': '🔗 Game Cocokkan',
      'sequencing-game': '📋 Game Urutkan',
      'game-mission': '🎯 Game Misi',
    };
    return labels[gameScene.sceneType] || gameScene.sceneType;
  };

  return (
    <div
      className="template-picker-overlay"
      data-testid="template-picker-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Pilih Template Pedagogis"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'var(--color-overlay-scrim-navy)', backdropFilter: 'blur(4px)',
        display: 'grid', placeItems: 'center',
      }}
      onClick={onClose}
    >
      <div
        className="template-picker-dialog"
        data-testid="template-picker-dialog"
        style={{
          background: 'linear-gradient(145deg, var(--color-panel) 0%, var(--color-panel-soft) 100%)',
          borderRadius: 20, padding: 32, maxWidth: 760, width: '92%',
          maxHeight: '82vh', overflow: 'auto',
          boxShadow: '0 12px 48px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ margin: '0 0 4px 0', fontSize: 22, fontWeight: 800, color: 'var(--color-text-strong)', letterSpacing: '-0.02em' }}>
                📋 Template Pedagogis
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--color-muted)' }}>
                Pilih template siap pakai — lengkap dengan panduan guru, rubrik, dan jalur diferensiasi.
              </p>
            </div>
            <button
              data-testid="template-picker-close"
              onClick={onClose}
              aria-label="Tutup"
              style={{
                border: 'none', background: 'var(--color-panel-soft)', fontSize: 18, cursor: 'pointer',
                color: 'var(--color-muted)', borderRadius: 8, width: 32, height: 32, display: 'grid', placeItems: 'center',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-border-neutral)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-panel-soft)'; }}
            >✕</button>
          </div>
        </div>

        {/* Filter */}
        <div data-testid="template-filter" style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {mapelList.map((m) => (
            <button
              key={m}
              data-testid={`filter-${m}`}
              onClick={() => setSelectedMapel(m)}
              style={{
                padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                border: selectedMapel === m ? '2px solid var(--color-accent)' : '2px solid var(--color-border-neutral)',
                background: selectedMapel === m ? 'var(--color-accent)' : 'var(--color-panel)',
                color: selectedMapel === m ? 'var(--color-panel)' : 'var(--color-text-soft)',
                transition: 'all 0.15s',
              }}
            >{m === 'all' ? '📊 Semua Mapel' : m}</button>
          ))}
        </div>

        {/* Template cards */}
        <div data-testid="template-list" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {templates.map((template) => {
            const status = getQualityStatus(template);
            const gameType = getGameType(template);
            return (
              <div
                key={template.id}
                data-testid={`template-card-${template.id}`}
                style={{
                  border: '1px solid var(--color-border-neutral)', borderRadius: 14, padding: 18,
                  background: 'var(--color-panel)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'box-shadow 0.18s, border-color 0.18s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = 'var(--color-border-strong)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = 'var(--color-border-neutral)'; }}
              >
                {/* Title row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--color-text-strong)', letterSpacing: '-0.01em' }}>{template.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 3 }}>
                      {template.mapel} · Kelas {template.grade} · Fase {template.phase}
                    </div>
                  </div>
                  {/* Mapel badge */}
                  <span style={{
                    fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 999,
                    background: 'var(--color-accent)', color: 'var(--color-panel)', letterSpacing: '0.04em', textTransform: 'uppercase',
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>{template.mapel}</span>
                </div>

                {/* Description */}
                <div style={{ fontSize: 14, color: 'var(--color-text-soft)', lineHeight: 1.5, marginBottom: 12 }}>{template.description}</div>

                {/* Badges row */}
                <div data-testid={`template-status-${template.id}`} style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, background: status.valid ? 'var(--color-success-soft)' : 'var(--color-danger-soft)', color: status.valid ? 'var(--color-success-deep)' : 'var(--color-danger-deep)', fontWeight: 700 }}>
                    {status.valid ? '✓ Valid' : '✗ Invalid'}
                  </span>
                  <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, background: status.qualityPass ? 'var(--color-success-soft)' : 'var(--color-danger-soft)', color: status.qualityPass ? 'var(--color-success-deep)' : 'var(--color-danger-deep)', fontWeight: 700 }}>
                    {status.qualityPass ? '✓ Quality' : '✗ Issues'}
                  </span>
                  <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, background: 'var(--color-accent-soft)', color: 'var(--color-accent)', fontWeight: 700 }}>
                    {status.sceneCount} Scene
                  </span>
                  {status.hasCover && <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, background: 'var(--color-accent-soft)', color: 'var(--color-accent)', fontWeight: 700 }}>Cover</span>}
                  {status.hasClosing && <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, background: 'var(--color-accent-soft)', color: 'var(--color-accent)', fontWeight: 700 }}>Closing</span>}
                  {gameType && <span data-testid={`template-game-type-${template.id}`} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, background: 'var(--color-warning-soft)', color: 'var(--color-warning-deep)', fontWeight: 700 }}>{gameType}</span>}
                </div>

                {/* CTA */}
                <button
                  data-testid={`template-apply-${template.id}`}
                  onClick={() => handleApply(template)}
                  disabled={applied}
                  style={{
                    padding: '10px 20px', borderRadius: 10, border: 'none',
                    background: applied ? 'var(--color-muted)' : 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 100%)',
                    color: 'var(--color-panel)', fontWeight: 700, fontSize: 14, cursor: applied ? 'default' : 'pointer',
                    boxShadow: applied ? 'none' : '0 2px 8px rgba(29,53,87,0.3)',
                    transition: 'all 0.18s',
                  }}
                  onMouseEnter={(e) => { if (!applied) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(29,53,87,0.4)'; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(29,53,87,0.3)'; }}
                >{applied ? '✓ Diterapkan' : 'Gunakan Template →'}</button>
              </div>
            );
          })}
        </div>

        {templates.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--color-muted)', fontSize: 14 }}>
            Belum ada template untuk mapel ini.
          </div>
        )}

        {/* L5-2: Custom Templates Section */}
        {customTemplates.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{
              fontSize: 15, fontWeight: 800, color: 'var(--color-text-strong)',
              marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid var(--color-border-neutral)',
            }}>
              📝 Template Saya
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-muted)', marginLeft: 8 }}>
                {customTemplates.length} template tersimpan
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {customTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  data-testid={`custom-template-${tpl.id}`}
                  style={{
                    border: '1px solid var(--color-border-neutral)', borderRadius: 12, padding: 14,
                    background: 'var(--color-panel)',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 700, color: 'var(--color-text-strong)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{tpl.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2, display: 'flex', gap: 10 }}>
                      <span>📄 {tpl.pageCount} halaman</span>
                      <span>🏷️ {tpl.mapel}</span>
                    </div>
                  </div>
                  <button
                    data-testid={`custom-template-apply-${tpl.id}`}
                    onClick={() => handleApplyCustom(tpl.id)}
                    disabled={applied}
                    style={{
                      padding: '7px 14px', borderRadius: 8, border: 'none',
                      background: applied ? 'var(--color-muted)' : 'var(--color-accent)',
                      color: 'var(--color-panel)', fontWeight: 700, fontSize: 12, cursor: applied ? 'default' : 'pointer',
                    }}
                  >{applied ? '✓' : 'Gunakan'}</button>
                  <button
                    data-testid={`custom-template-delete-${tpl.id}`}
                    onClick={() => setConfirmDeleteTemplate(tpl.id)}
                    style={{
                      padding: '7px 10px', borderRadius: 8, border: '1px solid var(--color-border)',
                      background: 'var(--color-panel)', color: 'var(--color-danger-strong)',
                      fontSize: 12, cursor: 'pointer',
                    }}
                  >🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Overwrite confirmation */}
      {confirmOverwrite && (
        <div
          data-testid="overwrite-confirm"
          style={{
            position: 'fixed', inset: 0, zIndex: 1100, background: 'var(--color-overlay-scrim)',
            display: 'grid', placeItems: 'center',
          }}
          onClick={() => setConfirmOverwrite(null)}
        >
          <div
            style={{
              background: 'var(--color-panel)', borderRadius: 16, padding: 28, maxWidth: 420, width: '88%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text-strong)', marginBottom: 8 }}>⚠️ Ganti Project?</div>
            <div style={{ fontSize: 14, color: 'var(--color-text-soft)', lineHeight: 1.5, marginBottom: 20 }}>
              Project saat ini akan diganti oleh template "{confirmOverwrite.name}". Perubahan yang belum disimpan akan hilang.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                data-testid="overwrite-cancel"
                onClick={() => setConfirmOverwrite(null)}
                style={{
                  padding: '8px 18px', borderRadius: 8, border: '2px solid var(--color-border-neutral)',
                  background: 'var(--color-panel)', color: 'var(--color-text-soft)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                }}
              >Batal</button>
              <button
                data-testid="overwrite-ok"
                onClick={() => doApply(confirmOverwrite)}
                style={{
                  padding: '8px 18px', borderRadius: 8, border: 'none',
                  background: 'var(--color-danger-strong)', color: 'var(--color-panel)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                }}
              >Ya, Ganti</button>
            </div>
          </div>
        </div>
      )}

      {/* L5-2: Custom template overwrite confirmation */}
      {confirmCustomOverwrite && (
        <div
          data-testid="custom-overwrite-confirm"
          style={{
            position: 'fixed', inset: 0, zIndex: 1100, background: 'var(--color-overlay-scrim)',
            display: 'grid', placeItems: 'center',
          }}
          onClick={() => setConfirmCustomOverwrite(null)}
        >
          <div
            style={{
              background: 'var(--color-panel)', borderRadius: 16, padding: 28, maxWidth: 420, width: '88%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 800 }}>Ganti Proyek?</h3>
            <p style={{ fontSize: 14, color: 'var(--color-text-soft)', margin: '0 0 16px', lineHeight: 1.5 }}>
              Proyek saat ini akan diganti dengan template ini. Simpan proyek saat ini terlebih dahulu jika perlu.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmCustomOverwrite(null)} style={{
                padding: '8px 18px', borderRadius: 8, border: '2px solid var(--color-border-neutral)',
                background: 'var(--color-panel)', color: 'var(--color-text-soft)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}>Batal</button>
              <button onClick={() => doApplyCustom(confirmCustomOverwrite)} style={{
                padding: '8px 18px', borderRadius: 8, border: 'none',
                background: 'var(--color-accent)', color: 'var(--color-panel)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}>Ya, Ganti</button>
            </div>
          </div>
        </div>
      )}

      {/* L5-2: Custom template delete confirmation */}
      {confirmDeleteTemplate && (
        <div
          data-testid="custom-delete-confirm"
          style={{
            position: 'fixed', inset: 0, zIndex: 1100, background: 'var(--color-overlay-scrim)',
            display: 'grid', placeItems: 'center',
          }}
          onClick={() => setConfirmDeleteTemplate(null)}
        >
          <div
            style={{
              background: 'var(--color-panel)', borderRadius: 16, padding: 28, maxWidth: 380, width: '88%',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 800 }}>Hapus Template?</h3>
            <p style={{ fontSize: 14, color: 'var(--color-text-soft)', margin: '0 0 16px' }}>
              Template yang dihapus tidak dapat dikembalikan.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDeleteTemplate(null)} style={{
                padding: '8px 18px', borderRadius: 8, border: '2px solid var(--color-border-neutral)',
                background: 'var(--color-panel)', color: 'var(--color-text-soft)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}>Batal</button>
              <button onClick={() => handleDeleteCustom(confirmDeleteTemplate)} style={{
                padding: '8px 18px', borderRadius: 8, border: 'none',
                background: 'var(--color-danger-strong)', color: 'var(--color-panel)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}>Hapus</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
