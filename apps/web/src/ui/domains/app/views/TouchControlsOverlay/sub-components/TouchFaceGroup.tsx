/* @layer renderer-components @kind component */
/** SNES ABXY diamond face cluster with authentic button icons and slide/chord support. */
import { Box, Image, Text } from '@ds/primitives';
import { useTouchControlsStore } from '@app/stores/touch-controls-store';
import { FACE_BUTTONS } from '../TouchControlsOverlay.constants';
import type { TouchEngineResult } from '../TouchControlsOverlay.type';

interface TouchFaceGroupProps {
  engine: TouchEngineResult;
}

const TouchFaceGroup = (props: TouchFaceGroupProps) => {
  const { engine } = props;
  const editing = useTouchControlsStore((s) => s.editing);
  const selectedGroup = useTouchControlsStore((s) => s.selectedGroup);
  const layout = useTouchControlsStore((s) =>
    engine.orientation === 'portrait' ? s.portrait.face : s.landscape.face,
  );

  if (!layout.visible && !editing) return null;

  const isSelected = editing && selectedGroup === 'face';
  const groupCls = [
    'touch-group',
    'touch-group--face',
    !layout.visible ? 'touch-group--hidden-preview' : '',
    isSelected ? 'touch-group--selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Box
      className={groupCls}
      style={engine.groupStyle('face')}
      onPointerDown={(e) => engine.onGroupPointerDown('face', e)}
      onPointerMove={(e) => engine.onGroupPointerMove('face', e)}
      onPointerUp={(e) => engine.onGroupPointerUp('face', e)}
      onPointerCancel={(e) => engine.onGroupPointerUp('face', e)}
    >
      <Box className="touch-face">
        <Box className="touch-face__ring" />
        {FACE_BUTTONS.map((def) => (
          <Box
            key={def.button}
            ref={(el) => engine.registerBtnRef(def.button, el)}
            className={`touch-face__btn ${def.className}`}
          >
            <Image
              className="touch-face__icon"
              src={def.iconSrc}
              alt={def.button}
              draggable={false}
            />
          </Box>
        ))}
      </Box>
      {editing ? <Text className="touch-group__badge">ABXY</Text> : null}
    </Box>
  );
};

export { TouchFaceGroup };
