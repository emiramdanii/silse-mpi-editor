/**
 * Component utilities for silse-mpi-editor.
 *
 * Layer: components
 * Allowed imports: ../core
 *
 * Type guards and helpers for the PageComponent union.
 */

import type {
  CardComponent,
  GameComponent,
  ImageComponent,
  NavigationComponent,
  PageComponent,
  QuestionComponent,
  TextComponent,
} from '../core/types';

export function isTextComponent(c: PageComponent): c is TextComponent {
  return c.type === 'text';
}

export function isImageComponent(c: PageComponent): c is ImageComponent {
  return c.type === 'image';
}

export function isCardComponent(c: PageComponent): c is CardComponent {
  return c.type === 'card';
}

export function isNavigationComponent(c: PageComponent): c is NavigationComponent {
  return c.type === 'navigation';
}

export function isQuestionComponent(c: PageComponent): c is QuestionComponent {
  return c.type === 'question';
}

export function isGameComponent(c: PageComponent): c is GameComponent {
  return c.type === 'game';
}
