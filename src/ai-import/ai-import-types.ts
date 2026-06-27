/**
 * AI Import types for silse-mpi-editor.
 *
 * Layer: ai-import
 * Allowed imports: ../core (types only)
 *
 * Kontrak (Batch 8 / M8):
 *   AI boleh memberi struktur project, page, component, stylePack, dan style token.
 *   AI tidak boleh memberi raw HTML/CSS/JS/className/CDN.
 */

import type { PageRole, LayoutId, PageBackground } from '../core/types';
import type { StylePack } from '../core/style-types';

export const AI_IMPORT_SCHEMA_VERSION = 1 as const;

/**
 * Payload dari AI generator. Input ke normalizer.
 */
export type SilseAiImportPayload = {
  schemaVersion: number;
  source: 'ai';
  project: {
    title?: string;
    pages: AiImportPage[];
  };
  stylePack?: StylePack;
};

export type AiImportPage = {
  title?: string;
  role?: PageRole;
  layoutId?: LayoutId;
  background?: PageBackground;
  components: AiImportComponent[];
};

export type AiImportComponent = {
  type: 'text' | 'image' | 'card' | 'navigation';
  // text
  text?: string;
  variant?: string;
  // image
  src?: string;
  alt?: string;
  objectFit?: 'cover' | 'contain';
  // card
  title?: string;
  body?: string;
  // navigation
  label?: string;
  action?: 'next' | 'prev' | 'goto';
  targetPageId?: string;
  // geometry
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};
