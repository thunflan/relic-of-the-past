/* @layer renderer-components @kind constants */
/** Base dimensions and button metadata for the on-screen touch controls overlay. */
import type { SnesButton } from '@shared/types/controls';
import type { TouchGroupId, TouchPresetId } from '@app/stores/touch-controls-presets';
import { getSnesIconUrl } from '@app/lib/input/button-icons';

/** Base bounding box dimensions (in CSS px at scale = 1.0) for each control group. */
const GROUP_DIMENSIONS: Record<TouchGroupId, { width: number; height: number }> = {
  dpad: { width: 156, height: 156 },
  face: { width: 164, height: 164 },
  l: { width: 92, height: 44 },
  r: { width: 92, height: 44 },
  select: { width: 68, height: 34 },
  start: { width: 68, height: 34 },
  turbo: { width: 46, height: 42 },
  menu: { width: 46, height: 42 },
};

interface FaceButtonDef {
  button: SnesButton;
  className: string;
  iconSrc: string;
  /** Normalized center coordinates (-1..1) within the face cluster for hit testing. */
  nx: number;
  ny: number;
}

const FACE_BUTTONS: readonly FaceButtonDef[] = [
  { button: 'X', className: 'touch-face__btn--x', iconSrc: getSnesIconUrl('X'), nx: 0, ny: -0.64 },
  { button: 'Y', className: 'touch-face__btn--y', iconSrc: getSnesIconUrl('Y'), nx: -0.64, ny: 0 },
  { button: 'A', className: 'touch-face__btn--a', iconSrc: getSnesIconUrl('A'), nx: 0.64, ny: 0 },
  { button: 'B', className: 'touch-face__btn--b', iconSrc: getSnesIconUrl('B'), nx: 0, ny: 0.64 },
];

const DPAD_DIRECTIONS: readonly SnesButton[] = ['Up', 'Down', 'Left', 'Right'];

const PRESET_OPTIONS: readonly { id: TouchPresetId; label: string }[] = [
  { id: 'standard', label: 'Standard' },
  { id: 'compact', label: 'Compact' },
  { id: 'high', label: 'High Grip' },
];

const GRID_STEP_PX = 8;

export {
  GROUP_DIMENSIONS,
  FACE_BUTTONS,
  DPAD_DIRECTIONS,
  PRESET_OPTIONS,
  GRID_STEP_PX,
};
export type { FaceButtonDef };
