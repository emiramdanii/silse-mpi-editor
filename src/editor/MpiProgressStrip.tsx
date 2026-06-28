/**
 * MpiProgressStrip — indikator visual 10 standar halaman MPI.
 *
 * Layer: editor (UI helper, UX-01)
 * Allowed imports: react, ../store/editor-store, ../core/mpi-quality-check, ./mpi-standard-roles
 *
 * Kontrak (UX-01 Scope A):
 *   - Tampilkan 10 peran standar MPI sebagai chip horizontal.
 *   - Chip hijau = role sudah ada di project.
 *   - Chip abu-abu = role belum ada.
 *   - Klik chip → pindah ke halaman pertama dengan role itu, kalau ada.
 *   - Pesan status: "MPI Standar 7/10 terpenuhi" + warna sesuai coverage.
 *   - Bila ada warning quality check, tampilkan ⚠ dengan jumlah.
 */

import { useEditorStore } from '../store/editor-store';
import { checkMpiStandard } from '../core/mpi-quality-check';
import { MPI_STANDARD_ROLES, getRoleInfo, type MpiStandardRoleInfo } from './mpi-standard-roles';
import type { PageRole } from '../core/types';

export function MpiProgressStrip() {
  const project = useEditorStore((s) => s.project);
  const selectPage = useEditorStore((s) => s.selectPage);
  const qc = checkMpiStandard(project);
  const presentRoles = new Set<PageRole>(project.pages.map((p) => p.role));
  const presentCount = MPI_STANDARD_ROLES.filter((r) => presentRoles.has(r.role)).length;
  const total = MPI_STANDARD_ROLES.length;
  const isComplete = presentCount === total;
  const hasIssues = !qc.pass || qc.warnings.length > 0;

  const handleClick = (role: PageRole) => {
    const page = project.pages.find((p) => p.role === role);
    if (page) selectPage(page.id);
  };

  return (
    <div
      className="mpi-progress-strip"
      data-testid="mpi-progress-strip"
      role="group"
      aria-label="Indikator cakupan standar MPI"
    >
      <div className="mpi-progress-strip__head">
        <span className="mpi-progress-strip__title">
          Standar MPI
        </span>
        <span
          className={`mpi-progress-strip__ratio${isComplete ? ' is-complete' : ''}`}
          data-testid="mpi-progress-ratio"
        >
          {presentCount}/{total}
        </span>
        {hasIssues && (
          <span
            className="mpi-progress-strip__flag mpi-progress-strip__flag--warn"
            title={qc.errors.concat(qc.warnings).join('\n')}
            data-testid="mpi-progress-flag"
          >
            ⚠ {qc.errors.length + qc.warnings.length}
          </span>
        )}
        {!hasIssues && isComplete && (
          <span
            className="mpi-progress-strip__flag mpi-progress-strip__flag--ok"
            title="MPI memenuhi standar: 10 peran lengkap, tidak ada warning."
            data-testid="mpi-progress-flag"
          >
            ✓ Lengkap
          </span>
        )}
      </div>
      <div className="mpi-progress-strip__chips">
        {MPI_STANDARD_ROLES.map((info: MpiStandardRoleInfo) => {
          const isPresent = presentRoles.has(info.role);
          return (
            <button
              key={info.role}
              type="button"
              className={`mpi-chip${isPresent ? ' is-present' : ''}`}
              onClick={() => handleClick(info.role)}
              disabled={!isPresent}
              title={
                isPresent
                  ? `${info.label} — ${info.hint} (klik untuk pindah)`
                  : `${info.label} — belum ada. ${info.hint}`
              }
              data-testid={`mpi-chip-${info.role}`}
              data-role={info.role}
              data-present={isPresent ? 'true' : 'false'}
            >
              <span className="mpi-chip__icon" aria-hidden>{info.icon}</span>
              <span className="mpi-chip__label">{info.short}</span>
            </button>
          );
        })}
      </div>
      {!isComplete && (
        <div className="mpi-progress-strip__hint" data-testid="mpi-progress-hint">
          {presentCount < total
            ? `Belum lengkap: ${total - presentCount} peran standar belum ada.`
            : null}
        </div>
      )}
    </div>
  );
}

/**
 * Friendly label untuk role tertentu — dipakai di beberapa tempat di editor.
 */
export function friendlyRoleLabel(role: PageRole): string {
  return getRoleInfo(role).label;
}
