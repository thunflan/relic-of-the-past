/** @layer renderer @kind config */
import type { Layout, TouchSettings } from './types';

/**
 * Layout padrão inspirado no consenso da comunidade (RetroArch / Delta / Lemuroid):
 * D-pad à esquerda, losango SNES à direita, L/R nos cantos superiores,
 * Select/Start centralizados embaixo, longe da área de jogo central.
 */
export const DEFAULT_LANDSCAPE: Layout = {
  dpad:   { anchor: 'bl', x: 6,  y: 6,  size: 38 },
  face:   { anchor: 'br', x: 5,  y: 5,  size: 40 },
  L:      { anchor: 'tl', x: 4,  y: 4,  size: 20 },
  R:      { anchor: 'tr', x: 4,  y: 4,  size: 20 },
  SELECT: { anchor: 'bc', x: -9, y: 3,  size: 13 },
  START:  { anchor: 'bc', x: 9,  y: 3,  size: 13 },
};

/** Retrato: controles na metade de baixo, jogo em cima (padrão Delta/Lemuroid). */
export const DEFAULT_PORTRAIT: Layout = {
  dpad:   { anchor: 'bl', x: 6,  y: 22, size: 40 },
  face:   { anchor: 'br', x: 5,  y: 20, size: 44 },
  L:      { anchor: 'bl', x: 4,  y: 56, size: 22 },
  R:      { anchor: 'br', x: 4,  y: 56, size: 22 },
  SELECT: { anchor: 'bc', x: -11, y: 6, size: 15 },
  START:  { anchor: 'bc', x: 11,  y: 6, size: 15 },
};

export const DEFAULT_SETTINGS: TouchSettings = {
  enabled: true,
  opacity: 0.5,
  scale: 1,
  haptics: true,
  dpadMode: 'fixed',
  dpadDeadzone: 0.18,
  diagonalArc: 40,
  hideWithGamepad: true,
  buttonCombos: true,
  sink: 'gamepad',
};

export const STORAGE_KEY = 'rotp.touchControls.v1';
