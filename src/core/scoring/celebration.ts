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
 * Pure DOM manipulation. No React. Cleanup via setTimeout(particle.remove()).
 *
 * Catatan performa (sesuai arahan Bapak):
 *   - Partikel di-remove setelah animasi selesai (0.8s / 1.2s) → no memory leak
 *   - Parent container tidak re-render selama animasi (pointer-events: none)
 *   - Gunakan will-change: transform, opacity untuk GPU acceleration
 *   - Batch create partikel (loop, bukan recursive setTimeout)
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

/**
 * Trigger local burst — 15-20 partikel memancar dari origin element.
 * Partikel di-append ke origin element (harus position: relative atau absolute).
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
  // Buat container burst di dalam origin element
  let burstContainer = originElement.querySelector('.silse-burst-local') as HTMLElement | null;
  if (!burstContainer) {
    burstContainer = document.createElement('div');
    burstContainer.className = 'silse-burst-local';
    originElement.appendChild(burstContainer);
  }

  // Buat partikel
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'silse-particle';

    // Random direction + distance
    const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
    const distance = 50 + Math.random() * 100; // 50-150px
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;

    particle.style.setProperty('--tx', `${tx}px`);
    particle.style.setProperty('--ty', `${ty}px`);
    particle.style.setProperty('--color', pickRandomColor(palette));

    burstContainer.appendChild(particle);

    // Cleanup setelah animasi selesai (0.8s + buffer)
    setTimeout(() => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle);
      }
    }, 900);
  }

  // Cleanup container setelah semua partikel selesai
  setTimeout(() => {
    if (burstContainer && burstContainer.parentNode && burstContainer.children.length === 0) {
      burstContainer.parentNode.removeChild(burstContainer);
    }
  }, 1000);
}

/**
 * Trigger full-screen burst — 30-50 partikel memenuhi layar.
 * Partikel di-append ke container (biasanya canvas).
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
  const burstOverlay = document.createElement('div');
  burstOverlay.className = 'silse-burst-fullscreen';
  container.appendChild(burstOverlay);

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'silse-particle silse-particle-fullscreen';

    // Random direction + distance (lebih besar untuk full-screen)
    const angle = Math.random() * Math.PI * 2;
    const distance = 200 + Math.random() * 300; // 200-500px
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;

    particle.style.setProperty('--tx', `${tx}px`);
    particle.style.setProperty('--ty', `${ty}px`);
    particle.style.setProperty('--color', pickRandomColor(palette));

    burstOverlay.appendChild(particle);
  }

  // Cleanup overlay + partikel setelah animasi (1.2s + buffer)
  setTimeout(() => {
    if (burstOverlay.parentNode) {
      burstOverlay.parentNode.removeChild(burstOverlay);
    }
  }, 1400);
}

/**
 * Trigger streak indicator — teks mengambang "3x Berturut-turut!"
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
  const indicator = document.createElement('div');
  indicator.className = `silse-streak-indicator${isStreak5 ? ' is-streak-5' : ''}`;
  indicator.textContent = message;
  container.appendChild(indicator);

  // Cleanup setelah animasi (1.5s atau 1.8s + buffer)
  setTimeout(() => {
    if (indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
  }, isStreak5 ? 2000 : 1700);
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
      // Local burst di tombol
      if (originElement) {
        triggerLocalBurst(originElement, palette, 18);
      }
      break;

    case 'streak-3':
      // Local burst + streak indicator
      if (originElement) {
        triggerLocalBurst(originElement, palette, 20);
      }
      triggerStreakIndicator(container, `${streakCount}x Berturut-turut! Hebat!`, false);
      break;

    case 'streak-5':
      // Local burst eskalasi + streak indicator khusus
      if (originElement) {
        triggerLocalBurst(originElement, palette, 25);
      }
      triggerStreakIndicator(container, `🔥 ${streakCount}x STREAK! Luar Biasa! 🔥`, true);
      break;

    case 'module-complete':
      // Full-screen burst (bukan perfect)
      triggerFullScreenBurst(container, palette, 35);
      break;

    case 'perfect-score':
      // Full-screen burst + lencana emas visual (di-handle oleh dashboard)
      triggerFullScreenBurst(container, palette, 50);
      break;
  }
}
