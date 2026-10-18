/* @layer renderer-components @kind types */
/** Types for the on-screen touch controls overlay and interactive layout editor. */
import type { CSSProperties } from 'react';
import type { SnesButton } from '@shared/types/controls';
import type { TouchGroupId, TouchOrientation } from '@app/stores/touch-controls-presets';

interface TouchControlsOverlayProps {
  gameRunning: boolean;
  pageOpen: boolean;
}

interface FloatingDpadOrigin {
  active: boolean;
  x: number;
  y: number;
  dx: number;
  dy: number;
}

interface TouchEngineResult {
  visible: boolean;
  orientation: TouchOrientation;
  floatingOrigin: FloatingDpadOrigin;
  turboActive: boolean;
  groupStyle: (group: TouchGroupId) => CSSProperties;
  registerBtnRef: (button: SnesButton, el: HTMLElement | null) => void;
  registerStickRef: (el: HTMLElement | null) => void;
  onGroupPointerDown: (group: TouchGroupId, e: React.PointerEvent<HTMLElement>) => void;
  onGroupPointerMove: (group: TouchGroupId, e: React.PointerEvent<HTMLElement>) => void;
  onGroupPointerUp: (group: TouchGroupId, e: React.PointerEvent<HTMLElement>) => void;
  onTurboPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  onTurboPointerUp: (e: React.PointerEvent<HTMLElement>) => void;
  onMenuTrigger: (e: React.PointerEvent<HTMLElement>) => void;
}

export type { TouchControlsOverlayProps, FloatingDpadOrigin, TouchEngineResult };
