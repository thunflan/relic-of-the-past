/* @layer renderer-components @kind logic */
/** Positioning and drag-to-edit coordinate math for configurable touch control groups. */
import type { CSSProperties } from 'react';
import type { TouchControlPos, TouchGroupId } from '@app/stores/touch-controls-presets';
import { GROUP_DIMENSIONS, GRID_STEP_PX } from '../TouchControlsOverlay.constants';

const snapValue = (value: number, snap: boolean): number =>
  snap ? Math.round(value / GRID_STEP_PX) * GRID_STEP_PX : Math.round(value);

const buildGroupStyle = (
  pos: TouchControlPos,
  globalScale: number,
  group: TouchGroupId,
): CSSProperties => {
  const baseDim = GROUP_DIMENSIONS[group];
  const totalScale = globalScale * pos.scale;
  const width = Math.round(baseDim.width * totalScale);
  const height = Math.round(baseDim.height * totalScale);

  const style: CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
  };

  if (pos.anchor === 'bottom-left') {
    style.left = `calc(var(--sai-left, 0px) + ${pos.x}px)`;
    style.bottom = `calc(var(--sai-bottom, 0px) + ${pos.y}px)`;
  } else if (pos.anchor === 'bottom-right') {
    style.right = `calc(var(--sai-right, 0px) + ${pos.x}px)`;
    style.bottom = `calc(var(--sai-bottom, 0px) + ${pos.y}px)`;
  } else if (pos.anchor === 'top-left') {
    style.left = `calc(var(--sai-left, 0px) + ${pos.x}px)`;
    style.top = `calc(var(--sai-top, 0px) + ${pos.y}px)`;
  } else if (pos.anchor === 'top-right') {
    style.right = `calc(var(--sai-right, 0px) + ${pos.x}px)`;
    style.top = `calc(var(--sai-top, 0px) + ${pos.y}px)`;
  } else if (pos.anchor === 'bottom-center') {
    style.left = `calc(50% + ${pos.x}px - ${Math.round(width / 2)}px)`;
    style.bottom = `calc(var(--sai-bottom, 0px) + ${pos.y}px)`;
  } else if (pos.anchor === 'top-center') {
    style.left = `calc(50% + ${pos.x}px - ${Math.round(width / 2)}px)`;
    style.top = `calc(var(--sai-top, 0px) + ${pos.y}px)`;
  }

  return style;
};

const computeDraggedPos = (
  startPos: TouchControlPos,
  dx: number,
  dy: number,
  snap: boolean,
  viewportW: number,
  viewportH: number,
): { x: number; y: number } => {
  const isRight = startPos.anchor === 'bottom-right' || startPos.anchor === 'top-right';
  const isBottom =
    startPos.anchor === 'bottom-left' ||
    startPos.anchor === 'bottom-right' ||
    startPos.anchor === 'bottom-center';
  const isCenter = startPos.anchor === 'bottom-center' || startPos.anchor === 'top-center';

  const rawX = isRight ? startPos.x - dx : startPos.x + dx;
  const rawY = isBottom ? startPos.y - dy : startPos.y + dy;

  const maxX = Math.max(120, Math.round(viewportW * 0.85));
  const maxY = Math.max(120, Math.round(viewportH * 0.85));

  const clampedX = isCenter
    ? Math.max(-Math.round(viewportW * 0.45), Math.min(Math.round(viewportW * 0.45), rawX))
    : Math.max(0, Math.min(maxX, rawX));
  const clampedY = Math.max(0, Math.min(maxY, rawY));

  return {
    x: snapValue(clampedX, snap),
    y: snapValue(clampedY, snap),
  };
};

export { buildGroupStyle, computeDraggedPos };
