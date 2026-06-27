/**
 * Component utilities for silse-mpi-editor.
 *
 * Layer: components
 * Allowed imports: ../core
 *
 * Type guards and helpers for the PageComponent union.
 * Component view components (TextComponentView, ImageComponentView, NavigationComponentView)
 * will be added in M2/M4/M5 respectively.
 */

import type {
  NavigationComponent,
  ImageComponent,
  PageComponent,
  TextComponent,
} from '../core/types';

export function isTextComponent(c: PageComponent): c is TextComponent {
  return c.type === 'text';
}

export function isImageComponent(c: PageComponent): c is ImageComponent {
  return c.type === 'image';
}

export function isNavigationComponent(c: PageComponent): c is NavigationComponent {
  return c.type === 'navigation';
}
