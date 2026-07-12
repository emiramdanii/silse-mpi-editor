/**
 * ProjectLibraryDialog — Level 5 (Ecosystem & Workflow)
 *
 * Modal untuk menampilkan daftar proyek yang tersimpan di localStorage.
 * Guru bisa: Buka, Hapus, Ekspor JSON dari proyek yang tersimpan.
 *
 * Backend: src/storage/project-storage.ts (listSavedProjects, loadProjectFromLibrary,
 * deleteSavedProject, exportProjectJson) — semua sudah ada dan teruji.
 */

import { useState, useEffect, useCallback } from 'react';
import { useEditorStore } from '../store/editor-store';
import {
  listSavedProjects,
  loadProjectFromLibrary,
  deleteSavedProject,
  exportProjectJson,
  saveCurrentProject,
} from '../storage/project-storage';
import type { LibraryEntry } from '../storage/storage-types';

export function ProjectLibraryDialog({ onClose }: { onClose: () => void }) {
  const setProject = useEditorStore((s) => s.setProject);
  const currentProject = useEditorStore((s) => s.project);
  const [projects, setProjects] = useState<LibraryEntry[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmOverwrite, setConfirmOverwrite] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Load project list on mount
  const refreshList = useCallback(() => {
    setProjects(listSavedProjects());
  }, []);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  // ESC to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const hasExistingContent = currentProject.pages.length > 1 ||
    currentProject.pages.some((p) => p.components.length > 0 || p.sceneType);

  const handleOpen = (projectId: string) => {
    if (hasExistingContent && currentProject.id !== projectId) {
      setConfirmOverwrite(projectId);
      return;
    }
    doOpen(projectId);
  };

  const doOpen = (projectId: string) => {
    // Save current project first (autosave before switching)
    saveCurrentProject(currentProject);
    const result = loadProjectFromLibrary(projectId);
    if (result.ok && result.data) {
      setProject(result.data);
      setFeedback('Proyek berhasil dibuka.');
      setTimeout(() => onClose(), 600);
    } else if (!result.ok) {
      setFeedback(`Gagal membuka proyek: ${result.error}`);
    } else {
      setFeedback('Proyek tidak ditemukan.');
    }
    setConfirmOverwrite(null);
  };

  const handleDelete = (projectId: string) => {
    const result = deleteSavedProject(projectId);
    if (result.ok) {
      setFeedback('Proyek dihapus.');
      refreshList();
    } else {
      setFeedback(`Gagal menghapus: ${result.error}`);
    }
    setConfirmDelete(null);
  };

  const handleExportJson = (projectId: string) => {
    const result = loadProjectFromLibrary(projectId);
    if (result.ok && result.data) {
      const json = exportProjectJson(result.data);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.data.title.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setFeedback('JSON diunduh.');
    } else if (!result.ok) {
      setFeedback(`Gagal ekspor: ${result.error}`);
    } else {
      setFeedback('Proyek tidak ditemukan.');
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  const roleLabels: Record<string, string> = {
    cover: 'Cover', closing: 'Penutup', material: 'Materi', quiz: 'Quiz',
    game: 'Game', reflection: 'Refleksi', objectives: 'Tujuan',
    guide: 'Panduan', free: 'Bebas',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
        display: 'grid', placeItems: 'center', padding: 16,
      }}
      data-testid="project-library-dialog"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'var(--color-panel)', borderRadius: 16, maxWidth: 720, width: '100%',
          maxHeight: '80vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--color-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text-strong)', margin: 0 }}>
            📂 Proyek Saya
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', fontSize: 20, cursor: 'pointer',
              color: 'var(--color-muted)', padding: '4px 8px', borderRadius: 6,
            }}
            title="Tutup"
            data-testid="library-close"
          >✕</button>
        </div>

        {/* Feedback */}
        {feedback && (
          <div style={{
            padding: '8px 20px', background: 'var(--color-accent-soft)',
            color: 'var(--color-accent)', fontSize: 13, fontWeight: 600,
          }}>
            {feedback}
          </div>
        )}

        {/* Project list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {projects.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '40px 20px',
              color: 'var(--color-muted)', fontSize: 14,
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              Belum ada proyek tersimpan.
              <br />
              Gunakan tombol "Simpan ke Library" untuk menyimpan proyek Anda.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {projects.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', borderRadius: 10,
                    background: p.id === currentProject.id ? 'var(--color-accent-soft)' : 'var(--color-panel-soft)',
                    border: `1px solid ${p.id === currentProject.id ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    transition: 'border-color 0.15s ease',
                  }}
                  data-testid={`library-project-${p.id}`}
                >
                  {/* Project info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 700, color: 'var(--color-text)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {p.title || 'Tanpa Judul'}
                      {p.id === currentProject.id && (
                        <span style={{
                          marginLeft: 8, fontSize: 11, fontWeight: 600,
                          color: 'var(--color-accent)', background: 'var(--color-accent-soft)',
                          padding: '2px 8px', borderRadius: 999,
                        }}>Aktif</span>
                      )}
                    </div>
                    <div style={{
                      fontSize: 12, color: 'var(--color-muted)', marginTop: 2,
                      display: 'flex', gap: 12,
                    }}>
                      <span>📄 {p.pageCount} halaman</span>
                      <span>🏷️ {roleLabels[p.role] || p.role}</span>
                      <span>🕒 {formatDate(p.savedAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button
                      onClick={() => handleOpen(p.id)}
                      style={{
                        padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                        background: 'var(--color-accent)', color: '#fff', border: 'none',
                        cursor: 'pointer', transition: 'background 0.15s ease',
                      }}
                      title="Buka proyek ini"
                      data-testid={`library-open-${p.id}`}
                    >Buka</button>
                    <button
                      onClick={() => handleExportJson(p.id)}
                      style={{
                        padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                        background: 'var(--color-panel)', color: 'var(--color-text-soft)',
                        border: '1px solid var(--color-border)', cursor: 'pointer',
                      }}
                      title="Ekspor sebagai JSON"
                      data-testid={`library-export-${p.id}`}
                    >📋</button>
                    <button
                      onClick={() => setConfirmDelete(p.id)}
                      style={{
                        padding: '6px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                        background: 'var(--color-panel)', color: 'var(--color-danger-strong)',
                        border: '1px solid var(--color-border)', cursor: 'pointer',
                      }}
                      title="Hapus proyek"
                      data-testid={`library-delete-${p.id}`}
                    >🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px', borderTop: '1px solid var(--color-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
            {projects.length} proyek tersimpan
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
              background: 'var(--color-panel-soft)', color: 'var(--color-text)',
              border: '1px solid var(--color-border)', cursor: 'pointer',
            }}
          >Tutup</button>
        </div>

        {/* Delete confirmation overlay */}
        {confirmDelete && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'grid', placeItems: 'center', zIndex: 10,
          }} onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null); }}>
            <div style={{
              background: 'var(--color-panel)', borderRadius: 12, padding: 24,
              maxWidth: 360, textAlign: 'center',
              boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🗑️</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 16px' }}>
                Hapus proyek ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button
                  onClick={() => setConfirmDelete(null)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    background: 'var(--color-panel-soft)', border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                  }}
                >Batal</button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                    background: 'var(--color-danger-strong)', color: '#fff', border: 'none',
                    cursor: 'pointer',
                  }}
                  data-testid="library-confirm-delete"
                >Hapus</button>
              </div>
            </div>
          </div>
        )}

        {/* Overwrite confirmation overlay */}
        {confirmOverwrite && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'grid', placeItems: 'center', zIndex: 10,
          }} onClick={(e) => { if (e.target === e.currentTarget) setConfirmOverwrite(null); }}>
            <div style={{
              background: 'var(--color-panel)', borderRadius: 12, padding: 24,
              maxWidth: 360, textAlign: 'center',
              boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', margin: '0 0 16px' }}>
                Proyek saat ini belum disimpan. Buka proyek lain akan menggantinya.
                <br />
                <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                  (Proyek saat ini akan di-autosave terlebih dahulu)
                </span>
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button
                  onClick={() => setConfirmOverwrite(null)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    background: 'var(--color-panel-soft)', border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                  }}
                >Batal</button>
                <button
                  onClick={() => doOpen(confirmOverwrite)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                    background: 'var(--color-accent)', color: '#fff', border: 'none',
                    cursor: 'pointer',
                  }}
                  data-testid="library-confirm-overwrite"
                >Buka Proyek</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
