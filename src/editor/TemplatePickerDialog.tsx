/**
 * TemplatePickerDialog — TEMPLATE-PEDAGOGIS-READY-02
 *
 * Modal untuk pilih template pedagogis siap pakai.
 * Guru pilih template → generate MPI 12 scene → load ke editor.
 */

import { useState, useEffect } from 'react';
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

export function TemplatePickerDialog({ onClose }: { onClose: () => void }) {
  const setProject = useEditorStore((s) => s.setProject);
  const [selectedMapel, setSelectedMapel] = useState<string>('all');
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const mapelList = ['all', ...getUniqueTemplateMapelList()];
  const templates = selectedMapel === 'all' ? PEDAGOGICAL_TEMPLATES : getTemplatesByMapel(selectedMapel);

  const handleApply = (template: PedagogicalTemplate) => {
    const bp = templateToBlueprint(template);
    const project = aiBlueprintToSimpleProject(bp);
    project.currentPageId = project.pages[0]?.id ?? '';
    setProject(project);
    setApplied(true);
    setTimeout(() => onClose(), 500);
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
      errors: [...validationErrors.map((e) => e.message), ...qualityResult.errors.map((e) => e.message)],
    };
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
        background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center',
      }}
      onClick={onClose}
    >
      <div
        className="template-picker-dialog"
        data-testid="template-picker-dialog"
        style={{
          background: '#fff', borderRadius: 16, padding: 28, maxWidth: 720, width: '90%',
          maxHeight: '80vh', overflow: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1f2937' }}>📋 Template Pedagogis Siap Pakai</h2>
          <button
            data-testid="template-picker-close"
            onClick={onClose}
            aria-label="Tutup"
            style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}
          >✕</button>
        </div>

        {/* Filter */}
        <div data-testid="template-filter" style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {mapelList.map((m) => (
            <button
              key={m}
              data-testid={`filter-${m}`}
              onClick={() => setSelectedMapel(m)}
              style={{
                padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                border: selectedMapel === m ? '2px solid #1d3557' : '2px solid #e5e7eb',
                background: selectedMapel === m ? '#1d3557' : '#fff',
                color: selectedMapel === m ? '#fff' : '#374151',
              }}
            >{m === 'all' ? 'Semua' : m}</button>
          ))}
        </div>

        {/* Template cards */}
        <div data-testid="template-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {templates.map((template) => {
            const status = getQualityStatus(template);
            return (
              <div
                key={template.id}
                data-testid={`template-card-${template.id}`}
                style={{
                  border: '1px solid #e5e7eb', borderRadius: 12, padding: 16,
                  background: '#f9fafb',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#1f2937' }}>{template.name}</div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                      {template.mapel} · Kelas {template.grade} · Fase {template.phase} · {template.topic}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>{template.description}</div>

                {/* Quality status */}
                <div data-testid={`template-status-${template.id}`} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: status.valid ? '#d1fae5' : '#fee2e2', color: status.valid ? '#065f46' : '#991b1b', fontWeight: 700 }}>
                    {status.valid ? '✓ Blueprint Valid' : '✗ Blueprint Invalid'}
                  </span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: status.qualityPass ? '#d1fae5' : '#fee2e2', color: status.qualityPass ? '#065f46' : '#991b1b', fontWeight: 700 }}>
                    {status.qualityPass ? '✓ Content Quality' : '✗ Content Issues'}
                  </span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#dbeafe', color: '#1e40af', fontWeight: 700 }}>
                    {status.sceneCount} Scene
                  </span>
                  {status.hasCover && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#dbeafe', color: '#1e40af', fontWeight: 700 }}>✓ Cover</span>}
                  {status.hasClosing && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#dbeafe', color: '#1e40af', fontWeight: 700 }}>✓ Closing</span>}
                </div>

                {/* Game type */}
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
                  {(() => {
                    const gameScene = template.scenes.find((s) => ['classification-game', 'matching-game', 'sequencing-game', 'game-mission'].includes(s.sceneType));
                    return gameScene ? `🎮 Aktivitas: ${gameScene.sceneType}` : '';
                  })()}
                </div>

                <button
                  data-testid={`template-apply-${template.id}`}
                  onClick={() => handleApply(template)}
                  disabled={applied}
                  style={{
                    padding: '8px 18px', borderRadius: 8, border: 'none',
                    background: applied ? '#9ca3af' : '#1d3557', color: '#fff',
                    fontWeight: 700, fontSize: 14, cursor: applied ? 'default' : 'pointer',
                  }}
                >{applied ? '✓ Diterapkan' : 'Gunakan Template'}</button>
              </div>
            );
          })}
        </div>

        {templates.length === 0 && (
          <div style={{ textAlign: 'center', padding: 20, color: '#9ca3af' }}>Tidak ada template untuk mapel ini.</div>
        )}
      </div>
    </div>
  );
}
