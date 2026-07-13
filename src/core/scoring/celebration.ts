/**
 * @module celebration
 *
 * V2-PILAR-3: Pure functions untuk trigger CSS burst celebration.
 *
 * Layer: core (browser-only, but no React/DOM framework dependency)
 *
 * Bertanggung jawab untuk:
 *   - triggerLocalBurst(originElement, palette): 15-20 partikel memancar dari tombol
 *   - triggerFullScreenBurst(container, palette): 30-50 partikel memenuhi layar
 *   - triggerStreakIndicator(container, tier, streakCount): teks mengambang
 *   - triggerCelebration(tier, originElement, container, palette): dispatcher
 *
 * Pure DOM manipulation. No React.
 *
 * Patch Enhancement (V2-PILAR-3 PATCH):
 *   - Centralized celebration container (didaur ulang, bukan create/destroy per burst)
 *   - Dual cleanup: animationend (primary) + setTimeout (fallback safety net)
 *   - pointer-events: none pada container → partikel tidak pernah blokir interaksi
 *
 * Catatan performa (sesuai arahan Bapak):
 *   - Partikel di-remove via animationend + setTimeout (dual mechanism)
 *   - Parent container tidak re-render selama animasi (pointer-events: none)
 *   - Gunakan will-change: transform, opacity untuk GPU acceleration
 *   - Batch create partikel (loop, bukan recursive setTimeout)
 *   - Satu kontainer terpusat → reduce DOM operations, prevent element accumulation
 */

import type { CelebrationTier } from '../types';

/** Palet warna partikel — diambil dari token CSS. */
export type CelebrationPalette = {
  success: string;
  accent: string;
  primary: string;
  warning: string;
  gold: string;
};

/** Default palette — fallback jika tidak di-pass. */
export const DEFAULT_CELEBRATION_PALETTE: CelebrationPalette = {
  success: '#16a34a',
  accent: '#1e5b8f',
  primary: '#2563eb',
  warning: '#f59e0b',
  gold: '#f9c12e',
};

/**
 * Pick random color dari palette.
 */
function pickRandomColor(palette: CelebrationPalette): string {
  const colors = [palette.success, palette.accent, palette.primary, palette.warning, palette.gold];
  return colors[Math.floor(Math.random() * colors.length)];
}

// ---------------------------------------------------------------------------
// V2-PILAR-3 PATCH: Centralized celebration container (reused, not recreated)
// ---------------------------------------------------------------------------

/**
 * ID untuk kontainer terpusat yang didaur ulang.
 */
const CELEBRATION_CONTAINER_ID = 'silse-celebration-container';

/**
 * Get atau buat satu kontainer celebration terpusat di dalam parent element.
 *
 * Kontainer ini bersifat:
 *   - position: absolute, inset: 0 (menutupi seluruh parent)
 *   - pointer-events: none (tidak pernah blokir interaksi)
 *   - z-index: 200 (di atas komponen, di bawah modals)
 *   - Dibuat sekali, didaur ulang untuk semua burst
 *
 * @param parent Element canvas yang jadi host container
 * @returns HTMLElement kontainer celebration terpusat
 */
export function getCelebrationContainer(parent: HTMLElement): HTMLElement {
  let container = parent.querySelector(`#${CELEBRATION_CONTAINER_ID}`) as HTMLElement | null;
  if (!container) {
    container = document.createElement('div');
    container.id = CELEBRATION_CONTAINER_ID;
    container.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:200;overflow:visible;';
    parent.appendChild(container);
  }
  return container;
}

// ---------------------------------------------------------------------------
// V2-PILAR-3 PATCH: Dual cleanup — animationend (primary) + setTimeout (fallback)
// ---------------------------------------------------------------------------

/**
 * Pasang dual cleanup pada sebuah particle element.
 *
 * Lapisan 1 — animationend: hapus partikel saat CSS animation selesai.
 *   (Partikel pakai animation, bukan transition — event yang benar adalah
 *   animationend. transitionend juga di-listen sebagai defense-in-depth
 *   jika di masa depan ada transition.)
 *
 * Lapisan 2 — setTimeout: fallback safety net jika animationend tidak fire
 *   (misalnya karena browser throttling di background tab).
 *
 * @param particle Element partikel yang akan di-cleanup
 * @param fallbackDelay Ms delay untuk fallback setTimeout
 */
function attachDualCleanup(particle: HTMLElement, fallbackDelay: number): void {
  let cleaned = false;

  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    if (particle.parentNode) {
      particle.parentNode.removeChild(particle);
    }
  };

  // Lapisan 1: animationend (primary — partikel pakai CSS animation)
  particle.addEventListener('animationend', cleanup, { once: true });
  // Lapisan 1b: transitionend (defense-in-depth untuk future transitions)
  particle.addEventListener('transitionend', cleanup, { once: true });

  // Lapisan 2: setTimeout (fallback safety net)
  setTimeout(cleanup, fallbackDelay);
}

// ---------------------------------------------------------------------------
// Trigger functions
// ---------------------------------------------------------------------------

/**
 * Trigger local burst — 15-20 partikel memancar dari origin element.
 *
 * PATCH: Partikel sekarang ditempatkan di kontainer terpusat, bukan di
 * dalam origin element. Posisi dihitung dari bounding rect origin relatif
 * terhadap parent container.
 *
 * @param originElement Element tempat burst berasal (button yang diklik)
 * @param palette Warna partikel
 * @param particleCount Jumlah partikel (default 18)
 */
export function triggerLocalBurst(
  originElement: HTMLElement,
  palette: CelebrationPalette = DEFAULT_CELEBRATION_PALETTE,
  particleCount: number = 18,
): void {
  // PATCH: Gunakan kontainer terpusat di parent canvas
  const parent = originElement.closest('[data-testid="canvas-frame"], [data-testid="preview-canvas-frame"], .canvas-frame') as HTMLElement | null;
  if (!parent) {
    // Fallback: jika tidak ada canvas parent, gunakan origin element (backward compat)
    let burstContainer = originElement.querySelector('.silse-burst-local') as HTMLElement | null;
    if (!burstContainer) {
      burstContainer = document.createElement('div');
      burstContainer.className = 'silse-burst-local';
      originElement.appendChild(burstContainer);
    }
    createLocalBurstParticles(burstContainer, originElement, originElement, palette, particleCount);
    return;
  }

  const celebContainer = getCelebrationContainer(parent);

  // Hitung posisi origin relatif terhadap parent container
  const parentRect = parent.getBoundingClientRect();
  const originRect = originElement.getBoundingClientRect();
  const centerX = originRect.left - parentRect.left + originRect.width / 2;
  const centerY = originRect.top - parentRect.top + originRect.height / 2;

  createLocalBurstParticles(celebContainer, originElement, parent, palette, particleCount, centerX, centerY);
}

/**
 * Helper: buat partikel local burst di dalam container.
 */
function createLocalBurstParticles(
  container: HTMLElement,
  _originElement: HTMLElement,
  _parent: HTMLElement,
  palette: CelebrationPalette,
  particleCount: number,
  centerX?: number,
  centerY?: number,
): void {
  // Jika centerX/Y tidak di-pass, partikel dimulai dari tengah container
  const startX = centerX ?? 0;
  const startY = centerY ?? 0;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'silse-particle';

    // Posisikan partikel di titik asal burst
    particle.style.position = 'absolute';
    particle.style.left = `${startX}px`;
    particle.style.top = `${startY}px`;

    // Random direction + distance
    const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
    const distance = 50 + Math.random() * 100; // 50-150px
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;

    particle.style.setProperty('--tx', `${tx}px`);
    particle.style.setProperty('--ty', `${ty}px`);
    particle.style.setProperty('--color', pickRandomColor(palette));

    container.appendChild(particle);

    // PATCH: Dual cleanup — animationend + setTimeout
    attachDualCleanup(particle, 900);
  }
}

/**
 * Trigger full-screen burst — 30-50 partikel memenuhi layar.
 *
 * PATCH: Gunakan kontainer terpusat, bukan create/destroy overlay per burst.
 *
 * @param container Element canvas yang jadi overlay
 * @param palette Warna partikel
 * @param particleCount Jumlah partikel (default 40)
 */
export function triggerFullScreenBurst(
  container: HTMLElement,
  palette: CelebrationPalette = DEFAULT_CELEBRATION_PALETTE,
  particleCount: number = 40,
): void {
  // PATCH: Gunakan kontainer terpusat
  const celebContainer = getCelebrationContainer(container);

  // Hitung center container
  const containerRect = container.getBoundingClientRect();
  const centerX = containerRect.width / 2;
  const centerY = containerRect.height / 2;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'silse-particle silse-particle-fullscreen';

    // Posisikan partikel di center container
    particle.style.position = 'absolute';
    particle.style.left = `${centerX}px`;
    particle.style.top = `${centerY}px`;

    // Random direction + distance (lebih besar untuk full-screen)
    const angle = Math.random() * Math.PI * 2;
    const distance = 200 + Math.random() * 300; // 200-500px
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;

    particle.style.setProperty('--tx', `${tx}px`);
    particle.style.setProperty('--ty', `${ty}px`);
    particle.style.setProperty('--color', pickRandomColor(palette));

    celebContainer.appendChild(particle);

    // PATCH: Dual cleanup — animationend + setTimeout
    attachDualCleanup(particle, 1400);
  }

  // PATCH: Fallback safety — hapus sisa partikel setelah 1.5s
  setTimeout(() => {
    const remaining = celebContainer.querySelectorAll('.silse-particle-fullscreen');
    remaining.forEach((p) => {
      if (p.parentNode) p.parentNode.removeChild(p);
    });
  }, 1500);
}

/**
 * Trigger streak indicator — teks mengambang "3x Berturut-turut!"
 *
 * PATCH: Gunakan kontainer terpusat + dual cleanup.
 *
 * @param container Element tempat streak indicator di-append
 * @param message Teks yang ditampilkan
 * @param isStreak5 Apakah ini streak-5 ( styling berbeda)
 */
export function triggerStreakIndicator(
  container: HTMLElement,
  message: string,
  isStreak5: boolean = false,
): void {
  // PATCH: Gunakan kontainer terpusat
  const celebContainer = getCelebrationContainer(container);

  const indicator = document.createElement('div');
  indicator.className = `silse-streak-indicator${isStreak5 ? ' is-streak-5' : ''}`;
  indicator.textContent = message;
  celebContainer.appendChild(indicator);

  // PATCH: Dual cleanup
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    if (indicator.parentNode) indicator.parentNode.removeChild(indicator);
  };
  indicator.addEventListener('animationend', cleanup, { once: true });
  indicator.addEventListener('transitionend', cleanup, { once: true });
  setTimeout(cleanup, isStreak5 ? 2000 : 1700);
}

/**
 * Dispatcher: trigger celebration berdasarkan tier.
 *
 * @param tier Celebration tier dari getCelebrationTier()
 * @param originElement Element tempat local burst berasal (untuk 'answer', 'streak-3', 'streak-5')
 * @param container Element canvas untuk full-screen + streak indicator
 * @param palette Warna partikel
 * @param streakCount Jumlah streak saat ini (untuk pesan streak)
 */
export function triggerCelebration(
  tier: CelebrationTier | null,
  originElement: HTMLElement | null,
  container: HTMLElement,
  palette: CelebrationPalette = DEFAULT_CELEBRATION_PALETTE,
  streakCount: number = 0,
): void {
  if (!tier) return;

  // Check prefers-reduced-motion — skip semua visual jika aktif
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  switch (tier) {
    case 'answer':
      if (originElement) {
        triggerLocalBurst(originElement, palette, 18);
      }
      break;

    case 'streak-3':
      if (originElement) {
        triggerLocalBurst(originElement, palette, 20);
      }
      triggerStreakIndicator(container, `${streakCount}x Berturut-turut! Hebat!`, false);
      break;

    case 'streak-5':
      if (originElement) {
        triggerLocalBurst(originElement, palette, 25);
      }
      triggerStreakIndicator(container, `🔥 ${streakCount}x STREAK! Luar Biasa! 🔥`, true);
      break;

    case 'module-complete':
      triggerFullScreenBurst(container, palette, 35);
      break;

    case 'perfect-score':
      triggerFullScreenBurst(container, palette, 50);
      break;
  }
}
