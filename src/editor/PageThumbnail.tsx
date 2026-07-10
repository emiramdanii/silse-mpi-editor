/**
 * PageThumbnail — mini 16:9 canvas preview per page (PAGE-THUMBNAIL-SIDEBAR-V1).
 *
 * Layer: editor
 * Allowed imports: react, ../core/types, ./mpi-standard-roles, ./mpi-page-status
 *
 * Kontrak:
 *   Mini 16:9 thumbnail (lebar ~220px, tinggi ~124px) yang menunjukkan
 *   layout komponen halaman secara visual. Bukan full render — hanya
 *   zone blocks (colored divs per component type).
 *   Klik = pilih halaman (sama seperti list item).
 *   Active page = border biru.
 *   Status badge (✓/⚠/✗) tampil di pojok thumbnail.
 */

import type { SimplePage, PageComponent } from '../core/types';
import { getRoleInfo } from './mpi-standard-roles';
import { computePageStatus, statusIcon, type PageStatusLevel } from './mpi-page-status';
import type { SimpleProject } from '../core/types';

const THUMB_W = 220;
const THUMB_H = 124; // 16:9 ratio
const SCALE = THUMB_W / 1280; // canvas is 1280×720

const COMPONENT_COLORS: Record<string, string> = {
  text: 'var(--color-marker-text)',
  image: 'var(--color-marker-image)',
  card: 'var(--color-marker-card)',
  navigation: 'var(--color-marker-navigation)',
  question: 'var(--color-marker-question)',
  game: 'var(--color-marker-game)',
  'layered-info': 'var(--color-marker-layered-info)',
  'learning-bridge': 'var(--color-marker-learning-bridge)',
};

const COMPONENT_LABELS: Record<string, string> = {
  text: 'T',
  image: 'I',
  card: 'C',
  navigation: 'N',
  question: 'Q',
  game: 'G',
  'layered-info': 'L',
  'learning-bridge': 'B',
};

export function PageThumbnail({
  page,
  isActive,
  onClick,
  project,
}: {
  page: SimplePage;
  isActive: boolean;
  onClick: () => void;
  project?: SimpleProject;
}) {
  const info = getRoleInfo(page.role);
  const status = computePageStatus(page, project);
  const bgColor = page.background.type === 'color' ? page.background.color : 'var(--color-panel)';

  return (
    <button
      type="button"
      className={`page-thumbnail${isActive ? ' is-active' : ''}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      data-testid={`page-thumbnail-${page.id}`}
      data-role={page.role}
      data-status={status.level}
      title={`${page.title} — ${info.label}`}
      aria-label={`${page.title}, ${info.label}, status ${status.level}`}
      aria-pressed={isActive}
    >
      {/* Mini canvas */}
      <div
        className="page-thumbnail__canvas"
        style={{
          background: bgColor,
          width: THUMB_W,
          height: THUMB_H,
        }}
      >
        {/* Component blocks */}
        {page.components.map((comp) => (
          <ComponentBlock key={comp.id} comp={comp} />
        ))}

        {/* Empty state */}
        {page.components.length === 0 && (
          <div className="page-thumbnail__empty">kosong</div>
        )}
      </div>

      {/* Footer: step + role icon + title */}
      <div className="page-thumbnail__footer">
        <span className="page-thumbnail__icon" aria-hidden>{info.icon}</span>
        <span className="page-thumbnail__title">{page.title}</span>
        <span
          className={`page-thumbnail__status page-thumbnail__status--${status.level}`}
          title={status.issues.map((i) => i.message).join('\n') || 'Lengkap'}
        >
          {statusIcon(status.level as PageStatusLevel)}
        </span>
      </div>
    </button>
  );
}

function ComponentBlock({ comp }: { comp: PageComponent }) {
  const color = COMPONENT_COLORS[comp.type] ?? 'var(--color-muted)';
  const label = COMPONENT_LABELS[comp.type] ?? '?';
  const x = comp.x * SCALE;
  const y = comp.y * SCALE;
  const w = comp.width * SCALE;
  const h = comp.height * SCALE;

  return (
    <div
      className="page-thumbnail__block"
      style={{
        left: x,
        top: y,
        width: Math.max(w, 4),
        height: Math.max(h, 3),
        background: color,
      }}
      title={`${comp.type} (${comp.x},${comp.y} ${comp.width}×${comp.height})`}
    >
      <span className="page-thumbnail__block-label">{label}</span>
    </div>
  );
}
