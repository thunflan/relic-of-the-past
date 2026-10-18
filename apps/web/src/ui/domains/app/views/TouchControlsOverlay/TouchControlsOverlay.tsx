/* @layer renderer-app @kind component */
/**
 * Configurable on-screen Android/mobile touch controller overlay with interactive layout editor.
 * Feeds SNES button states directly into InputManager and supports multi-touch, slide-to-button,
 * chord combos, cross D-pad or virtual analog stick, floating D-pad origin, and fast-forward.
 */
import type { CSSProperties } from 'react';
import { Box } from '@ds/primitives';
import { useTouchControlsStore } from '@app/stores/touch-controls-store';
import { useTouchControlsEngine } from './behavior/useTouchControlsEngine';
import { TouchDpadGroup } from './sub-components/TouchDpadGroup';
import { TouchFaceGroup } from './sub-components/TouchFaceGroup';
import { TouchUtilityGroups } from './sub-components/TouchUtilityGroups';
import { TouchEditorToolbar } from './sub-components/TouchEditorToolbar';
import './TouchControlsOverlay.css';
import type { TouchControlsOverlayProps } from './TouchControlsOverlay.type';

const TouchControlsOverlay = (props: TouchControlsOverlayProps) => {
  const { gameRunning, pageOpen } = props;
  const settings = useTouchControlsStore((s) => s.settings);
  const editing = useTouchControlsStore((s) => s.editing);
  const engine = useTouchControlsEngine(gameRunning, pageOpen);

  if (!engine.visible) return null;

  const overlayStyle = {
    '--touch-opacity': String(settings.opacity),
  } as CSSProperties;

  return (
    <Box
      className={`touch-overlay ${editing ? 'touch-overlay--editing' : ''}`}
      style={overlayStyle}
    >
      {editing ? (
        <>
          <Box className="touch-overlay__grid" />
          <Box className="touch-overlay__center-v" />
          <Box className="touch-overlay__center-h" />
          <TouchEditorToolbar orientation={engine.orientation} />
        </>
      ) : null}

      <TouchDpadGroup engine={engine} />
      <TouchFaceGroup engine={engine} />
      <TouchUtilityGroups engine={engine} />
    </Box>
  );
};

export { TouchControlsOverlay };
