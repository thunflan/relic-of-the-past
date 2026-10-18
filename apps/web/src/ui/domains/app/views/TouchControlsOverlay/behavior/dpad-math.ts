/* @layer renderer-components @kind logic */
/** 8-way D-Pad angle/deadzone math, ABXY face cluster chord hit-testing, and haptics helper. */
import type { SnesButton } from '@shared/types/controls';
import type { TouchControlsSettings, TouchGroupId } from '@app/stores/touch-controls-presets';
import { FACE_BUTTONS } from '../TouchControlsOverlay.constants';

interface DpadHitResult {
  buttons: SnesButton[];
  normX: number;
  normY: number;
}

interface PointerEvalResult {
  buttons: SnesButton[];
  tx: number;
  ty: number;
}

const ALL_SNES_BUTTONS: readonly SnesButton[] = [
  'Up', 'Down', 'Left', 'Right', 'A', 'B', 'X', 'Y', 'L', 'R', 'Start', 'Select',
];

const SINGLE_GROUP_BUTTON: Partial<Record<TouchGroupId, SnesButton>> = {
  l: 'L',
  r: 'R',
  select: 'Select',
  start: 'Start',
};

const computeDpadButtons = (
  dx: number,
  dy: number,
  radius: number,
  deadzone: number,
  diagonalArcDeg: number,
): DpadHitResult => {
  const safeRadius = Math.max(24, radius);
  const dist = Math.hypot(dx, dy);
  const ratio = dist / safeRadius;
  const clampedRatio = Math.min(1, ratio);
  const angleRad = Math.atan2(dy, dx);
  const normX = dist > 0 ? Math.cos(angleRad) * clampedRatio : 0;
  const normY = dist > 0 ? Math.sin(angleRad) * clampedRatio : 0;

  if (ratio < deadzone) return { buttons: [], normX, normY };

  const deg = ((angleRad * 180) / Math.PI + 360) % 360;
  const halfDiag = Math.min(38, Math.max(10, diagonalArcDeg / 2));
  const buttons: SnesButton[] = [];

  if (deg >= 45 - halfDiag && deg <= 45 + halfDiag) buttons.push('Right', 'Down');
  else if (deg >= 135 - halfDiag && deg <= 135 + halfDiag) buttons.push('Down', 'Left');
  else if (deg >= 225 - halfDiag && deg <= 225 + halfDiag) buttons.push('Left', 'Up');
  else if (deg >= 315 - halfDiag && deg <= 315 + halfDiag) buttons.push('Up', 'Right');
  else if (deg > 45 + halfDiag && deg < 135 - halfDiag) buttons.push('Down');
  else if (deg > 135 + halfDiag && deg < 225 - halfDiag) buttons.push('Left');
  else if (deg > 225 + halfDiag && deg < 315 - halfDiag) buttons.push('Up');
  else buttons.push('Right');

  return { buttons, normX, normY };
};

const computeFaceButtons = (nx: number, ny: number, allowCombos: boolean): SnesButton[] => {
  const radial = Math.hypot(nx, ny);
  if (radial < 0.14 || radial > 1.35) return [];

  const scored = FACE_BUTTONS.map((def) => ({
    button: def.button,
    dist: Math.hypot(nx - def.nx, ny - def.ny),
  })).sort((a, b) => a.dist - b.dist);

  const primary = scored[0];
  const secondary = scored[1];
  if (!primary || primary.dist > 0.78) return [];

  if (
    allowCombos &&
    secondary &&
    secondary.dist < 0.62 &&
    Math.abs(primary.dist - secondary.dist) < 0.2
  ) {
    return [primary.button, secondary.button];
  }
  return [primary.button];
};

const evaluateGroupPointer = (
  group: TouchGroupId,
  originX: number,
  originY: number,
  radius: number,
  clientX: number,
  clientY: number,
  settings: TouchControlsSettings,
): PointerEvalResult => {
  if (group === 'dpad') {
    const hit = computeDpadButtons(
      clientX - originX,
      clientY - originY,
      radius,
      settings.dpadDeadzone,
      settings.diagonalArc,
    );
    const maxTravel = radius * 0.36;
    return {
      buttons: hit.buttons,
      tx: Math.round(hit.normX * maxTravel),
      ty: Math.round(hit.normY * maxTravel),
    };
  }
  if (group === 'face') {
    const nx = (clientX - originX) / radius;
    const ny = (clientY - originY) / radius;
    return { buttons: computeFaceButtons(nx, ny, settings.buttonCombos), tx: 0, ty: 0 };
  }
  const single = SINGLE_GROUP_BUTTON[group];
  return { buttons: single ? [single] : [], tx: 0, ty: 0 };
};

const triggerHaptic = (enabled: boolean, durationMs = 10): void => {
  if (!enabled) return;
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(durationMs);
    }
  } catch {
    /* ignore unsupported haptic devices */
  }
};

export {
  ALL_SNES_BUTTONS,
  computeDpadButtons,
  computeFaceButtons,
  evaluateGroupPointer,
  triggerHaptic,
};
export type { DpadHitResult, PointerEvalResult };
