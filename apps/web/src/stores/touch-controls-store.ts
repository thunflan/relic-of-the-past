/* @layer renderer-stores @kind logic */
/** Zustand store for on-screen touch controls settings, layout presets, and interactive layout editor state. */
import { create } from 'zustand';
import {
  DEFAULT_TOUCH_SETTINGS,
  LANDSCAPE_STANDARD_LAYOUT,
  PORTRAIT_DEFAULT_LAYOUT,
  TOUCH_GROUP_IDS,
  cloneLayout,
  getLandscapePreset,
} from './touch-controls-presets';
import type {
  TouchControlPos,
  TouchControlsSettings,
  TouchGroupId,
  TouchLayoutMap,
  TouchOrientation,
  TouchPresetId,
} from './touch-controls-presets';

const STORAGE_KEY = 'rotp.touchControls.v2';

interface PersistedTouchState {
  settings: TouchControlsSettings;
  landscape: TouchLayoutMap;
  portrait: TouchLayoutMap;
}

interface TouchControlsStore extends PersistedTouchState {
  editing: boolean;
  selectedGroup: TouchGroupId | null;
  updateSettings: (patch: Partial<TouchControlsSettings>) => void;
  applyPreset: (preset: TouchPresetId) => void;
  updateGroupPos: (orientation: TouchOrientation, group: TouchGroupId, patch: Partial<TouchControlPos>) => void;
  resetLayout: (orientation: TouchOrientation) => void;
  resetAll: () => void;
  setEditing: (editing: boolean) => void;
  setSelectedGroup: (group: TouchGroupId | null) => void;
}

const clamp = (val: number, min: number, max: number): number => Math.min(max, Math.max(min, val));

const sanitizeLayout = (
  raw: Partial<Record<TouchGroupId, Partial<TouchControlPos>>> | undefined,
  fallback: TouchLayoutMap,
): TouchLayoutMap => {
  const result = cloneLayout(fallback);
  if (!raw || typeof raw !== 'object') return result;
  for (const id of TOUCH_GROUP_IDS) {
    const entry = raw[id];
    if (!entry || typeof entry !== 'object') continue;
    const base = result[id];
    result[id] = {
      anchor: typeof entry.anchor === 'string' ? entry.anchor : base.anchor,
      x: typeof entry.x === 'number' && Number.isFinite(entry.x) ? Math.round(entry.x) : base.x,
      y: typeof entry.y === 'number' && Number.isFinite(entry.y) ? Math.round(entry.y) : base.y,
      scale: typeof entry.scale === 'number' && Number.isFinite(entry.scale) ? clamp(entry.scale, 0.5, 1.8) : base.scale,
      visible: typeof entry.visible === 'boolean' ? entry.visible : base.visible,
    };
  }
  return result;
};

const loadPersistedState = (): PersistedTouchState => {
  const defaults: PersistedTouchState = {
    settings: { ...DEFAULT_TOUCH_SETTINGS },
    landscape: cloneLayout(LANDSCAPE_STANDARD_LAYOUT),
    portrait: cloneLayout(PORTRAIT_DEFAULT_LAYOUT),
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<PersistedTouchState>;
    const s = parsed.settings ?? {};
    const d = defaults.settings;
    const settings: TouchControlsSettings = {
      enabled: typeof s.enabled === 'boolean' ? s.enabled : d.enabled,
      opacity: typeof s.opacity === 'number' ? clamp(s.opacity, 0.15, 1.0) : d.opacity,
      scale: typeof s.scale === 'number' ? clamp(s.scale, 0.6, 1.6) : d.scale,
      haptics: typeof s.haptics === 'boolean' ? s.haptics : d.haptics,
      dpadStyle: s.dpadStyle === 'stick' ? 'stick' : 'cross',
      dpadMode: s.dpadMode === 'floating' ? 'floating' : 'fixed',
      dpadDeadzone: typeof s.dpadDeadzone === 'number' ? clamp(s.dpadDeadzone, 0.05, 0.45) : d.dpadDeadzone,
      diagonalArc: typeof s.diagonalArc === 'number' ? clamp(s.diagonalArc, 20, 70) : d.diagonalArc,
      buttonCombos: typeof s.buttonCombos === 'boolean' ? s.buttonCombos : d.buttonCombos,
      hideWithGamepad: typeof s.hideWithGamepad === 'boolean' ? s.hideWithGamepad : d.hideWithGamepad,
      showTurbo: typeof s.showTurbo === 'boolean' ? s.showTurbo : d.showTurbo,
      turboMode: s.turboMode === 'toggle' ? 'toggle' : 'hold',
      showMenuButton: typeof s.showMenuButton === 'boolean' ? s.showMenuButton : d.showMenuButton,
      preset: s.preset === 'compact' || s.preset === 'high' || s.preset === 'custom' ? s.preset : 'standard',
      snapToGrid: typeof s.snapToGrid === 'boolean' ? s.snapToGrid : d.snapToGrid,
    };
    return {
      settings,
      landscape: sanitizeLayout(parsed.landscape, defaults.landscape),
      portrait: sanitizeLayout(parsed.portrait, defaults.portrait),
    };
  } catch {
    return defaults;
  }
};

const persistState = (s: PersistedTouchState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings: s.settings, landscape: s.landscape, portrait: s.portrait }));
  } catch { /* ignore storage quota errors */ }
};

const initial = loadPersistedState();

const useTouchControlsStore = create<TouchControlsStore>((set) => ({
  ...initial,
  editing: false,
  selectedGroup: 'dpad',

  updateSettings: (patch) =>
    set((state) => {
      const next: PersistedTouchState = { settings: { ...state.settings, ...patch }, landscape: state.landscape, portrait: state.portrait };
      persistState(next);
      return { settings: next.settings };
    }),

  applyPreset: (preset) =>
    set((state) => {
      const landscape = preset === 'custom' ? state.landscape : getLandscapePreset(preset);
      const next: PersistedTouchState = { settings: { ...state.settings, preset }, landscape, portrait: state.portrait };
      persistState(next);
      return { settings: next.settings, landscape };
    }),

  updateGroupPos: (orientation, group, patch) =>
    set((state) => {
      const current = state[orientation][group];
      const updatedGroup: TouchControlPos = {
        ...current,
        ...patch,
        scale: patch.scale !== undefined ? clamp(patch.scale, 0.5, 1.8) : current.scale,
      };
      const updatedMap: TouchLayoutMap = { ...state[orientation], [group]: updatedGroup };
      const settings = orientation === 'landscape' ? { ...state.settings, preset: 'custom' as const } : state.settings;
      const next: PersistedTouchState = {
        settings,
        landscape: orientation === 'landscape' ? updatedMap : state.landscape,
        portrait: orientation === 'portrait' ? updatedMap : state.portrait,
      };
      persistState(next);
      return next;
    }),

  resetLayout: (orientation) =>
    set((state) => {
      const preset = state.settings.preset === 'custom' ? 'standard' : state.settings.preset;
      const next: PersistedTouchState = {
        settings: orientation === 'landscape' ? { ...state.settings, preset } : state.settings,
        landscape: orientation === 'landscape' ? getLandscapePreset(preset) : state.landscape,
        portrait: orientation === 'portrait' ? cloneLayout(PORTRAIT_DEFAULT_LAYOUT) : state.portrait,
      };
      persistState(next);
      return next;
    }),

  resetAll: () =>
    set(() => {
      const next: PersistedTouchState = {
        settings: { ...DEFAULT_TOUCH_SETTINGS },
        landscape: cloneLayout(LANDSCAPE_STANDARD_LAYOUT),
        portrait: cloneLayout(PORTRAIT_DEFAULT_LAYOUT),
      };
      persistState(next);
      return next;
    }),

  setEditing: (editing) => set({ editing }),
  setSelectedGroup: (selectedGroup) => set({ selectedGroup }),
}));

export { useTouchControlsStore };
export type { TouchControlsStore };
