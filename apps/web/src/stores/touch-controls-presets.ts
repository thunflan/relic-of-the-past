/* @layer renderer-stores @kind constants */
/** Default layout presets and types for configurable on-screen Android/mobile touch controls. */

type TouchAnchor =
  | 'bottom-left'
  | 'bottom-right'
  | 'top-left'
  | 'top-right'
  | 'bottom-center'
  | 'top-center';

type TouchGroupId = 'dpad' | 'face' | 'l' | 'r' | 'start' | 'select' | 'turbo' | 'menu';

type DpadStyle = 'cross' | 'stick';
type DpadMode = 'fixed' | 'floating';
type TurboMode = 'hold' | 'toggle';
type TouchPresetId = 'standard' | 'compact' | 'high' | 'custom';
type TouchOrientation = 'landscape' | 'portrait';

interface TouchControlPos {
  anchor: TouchAnchor;
  /** Offset in px from the anchor horizontal edge (or center). */
  x: number;
  /** Offset in px from the anchor vertical edge. */
  y: number;
  /** Per-element scale multiplier (0.5 to 1.8). */
  scale: number;
  /** Whether this control group is visible. */
  visible: boolean;
}

type TouchLayoutMap = Record<TouchGroupId, TouchControlPos>;

interface TouchControlsSettings {
  enabled: boolean;
  opacity: number;
  scale: number;
  haptics: boolean;
  dpadStyle: DpadStyle;
  dpadMode: DpadMode;
  dpadDeadzone: number;
  diagonalArc: number;
  buttonCombos: boolean;
  hideWithGamepad: boolean;
  showTurbo: boolean;
  turboMode: TurboMode;
  showMenuButton: boolean;
  preset: TouchPresetId;
  snapToGrid: boolean;
}

const TOUCH_GROUP_IDS: readonly TouchGroupId[] = [
  'dpad',
  'face',
  'l',
  'r',
  'select',
  'start',
  'turbo',
  'menu',
];

const TOUCH_GROUP_LABELS: Record<TouchGroupId, string> = {
  dpad: 'D-Pad / Stick',
  face: 'ABXY Cluster',
  l: 'L Shoulder',
  r: 'R Shoulder',
  select: 'Select',
  start: 'Start',
  turbo: 'Fast-Forward',
  menu: 'Quick Menu',
};

const DEFAULT_TOUCH_SETTINGS: TouchControlsSettings = {
  enabled: true,
  opacity: 0.78,
  scale: 1.0,
  haptics: true,
  dpadStyle: 'cross',
  dpadMode: 'fixed',
  dpadDeadzone: 0.16,
  diagonalArc: 48,
  buttonCombos: true,
  hideWithGamepad: true,
  showTurbo: true,
  turboMode: 'hold',
  showMenuButton: true,
  preset: 'standard',
  snapToGrid: true,
};

const LANDSCAPE_STANDARD_LAYOUT: TouchLayoutMap = {
  dpad: { anchor: 'bottom-left', x: 26, y: 24, scale: 1.0, visible: true },
  face: { anchor: 'bottom-right', x: 24, y: 22, scale: 1.0, visible: true },
  l: { anchor: 'top-left', x: 20, y: 18, scale: 1.0, visible: true },
  r: { anchor: 'top-right', x: 20, y: 18, scale: 1.0, visible: true },
  select: { anchor: 'bottom-left', x: 208, y: 18, scale: 1.0, visible: true },
  start: { anchor: 'bottom-right', x: 208, y: 18, scale: 1.0, visible: true },
  turbo: { anchor: 'top-left', x: 132, y: 18, scale: 1.0, visible: true },
  menu: { anchor: 'top-right', x: 132, y: 18, scale: 1.0, visible: true },
};

const LANDSCAPE_COMPACT_LAYOUT: TouchLayoutMap = {
  dpad: { anchor: 'bottom-left', x: 16, y: 14, scale: 0.88, visible: true },
  face: { anchor: 'bottom-right', x: 16, y: 14, scale: 0.88, visible: true },
  l: { anchor: 'bottom-left', x: 18, y: 188, scale: 0.9, visible: true },
  r: { anchor: 'bottom-right', x: 18, y: 188, scale: 0.9, visible: true },
  select: { anchor: 'bottom-left', x: 178, y: 14, scale: 0.9, visible: true },
  start: { anchor: 'bottom-right', x: 178, y: 14, scale: 0.9, visible: true },
  turbo: { anchor: 'top-left', x: 18, y: 14, scale: 0.9, visible: true },
  menu: { anchor: 'top-right', x: 18, y: 14, scale: 0.9, visible: true },
};

const LANDSCAPE_HIGH_LAYOUT: TouchLayoutMap = {
  dpad: { anchor: 'bottom-left', x: 28, y: 66, scale: 1.05, visible: true },
  face: { anchor: 'bottom-right', x: 28, y: 66, scale: 1.05, visible: true },
  l: { anchor: 'top-left', x: 22, y: 24, scale: 1.05, visible: true },
  r: { anchor: 'top-right', x: 22, y: 24, scale: 1.05, visible: true },
  select: { anchor: 'bottom-left', x: 196, y: 26, scale: 1.0, visible: true },
  start: { anchor: 'bottom-right', x: 196, y: 26, scale: 1.0, visible: true },
  turbo: { anchor: 'top-left', x: 140, y: 24, scale: 1.0, visible: true },
  menu: { anchor: 'top-right', x: 140, y: 24, scale: 1.0, visible: true },
};

const PORTRAIT_DEFAULT_LAYOUT: TouchLayoutMap = {
  dpad: { anchor: 'bottom-left', x: 18, y: 48, scale: 0.96, visible: true },
  face: { anchor: 'bottom-right', x: 18, y: 48, scale: 0.96, visible: true },
  l: { anchor: 'bottom-left', x: 18, y: 226, scale: 0.95, visible: true },
  r: { anchor: 'bottom-right', x: 18, y: 226, scale: 0.95, visible: true },
  select: { anchor: 'bottom-center', x: -46, y: 14, scale: 0.92, visible: true },
  start: { anchor: 'bottom-center', x: 46, y: 14, scale: 0.92, visible: true },
  turbo: { anchor: 'top-left', x: 16, y: 16, scale: 0.92, visible: true },
  menu: { anchor: 'top-right', x: 16, y: 16, scale: 0.92, visible: true },
};

const cloneLayout = (layout: TouchLayoutMap): TouchLayoutMap => ({
  dpad: { ...layout.dpad },
  face: { ...layout.face },
  l: { ...layout.l },
  r: { ...layout.r },
  select: { ...layout.select },
  start: { ...layout.start },
  turbo: { ...layout.turbo },
  menu: { ...layout.menu },
});

const getLandscapePreset = (preset: TouchPresetId): TouchLayoutMap => {
  if (preset === 'compact') return cloneLayout(LANDSCAPE_COMPACT_LAYOUT);
  if (preset === 'high') return cloneLayout(LANDSCAPE_HIGH_LAYOUT);
  return cloneLayout(LANDSCAPE_STANDARD_LAYOUT);
};

export {
  TOUCH_GROUP_IDS,
  TOUCH_GROUP_LABELS,
  DEFAULT_TOUCH_SETTINGS,
  LANDSCAPE_STANDARD_LAYOUT,
  LANDSCAPE_COMPACT_LAYOUT,
  LANDSCAPE_HIGH_LAYOUT,
  PORTRAIT_DEFAULT_LAYOUT,
  cloneLayout,
  getLandscapePreset,
};
export type {
  TouchAnchor,
  TouchGroupId,
  DpadStyle,
  DpadMode,
  TurboMode,
  TouchPresetId,
  TouchOrientation,
  TouchControlPos,
  TouchLayoutMap,
  TouchControlsSettings,
};
