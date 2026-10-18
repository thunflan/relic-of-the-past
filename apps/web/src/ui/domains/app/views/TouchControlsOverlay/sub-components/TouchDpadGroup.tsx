/* @layer renderer-components @kind component */
/** On-screen SNES Cross D-Pad and Virtual Analog Stick group with floating-origin support. */
import { Box, Text } from '@ds/primitives';
import { useTouchControlsStore } from '@app/stores/touch-controls-store';
import type { TouchEngineResult } from '../TouchControlsOverlay.type';

interface TouchDpadGroupProps {
  engine: TouchEngineResult;
}

const TouchDpadGroup = (props: TouchDpadGroupProps) => {
  const { engine } = props;
  const settings = useTouchControlsStore((s) => s.settings);
  const editing = useTouchControlsStore((s) => s.editing);
  const selectedGroup = useTouchControlsStore((s) => s.selectedGroup);
  const layout = useTouchControlsStore((s) =>
    engine.orientation === 'portrait' ? s.portrait.dpad : s.landscape.dpad,
  );

  if (!layout.visible && !editing) return null;

  const isSelected = editing && selectedGroup === 'dpad';
  const groupCls = [
    'touch-group',
    'touch-group--dpad',
    !layout.visible ? 'touch-group--hidden-preview' : '',
    isSelected ? 'touch-group--selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <Box
        className={groupCls}
        style={engine.groupStyle('dpad')}
        onPointerDown={(e) => engine.onGroupPointerDown('dpad', e)}
        onPointerMove={(e) => engine.onGroupPointerMove('dpad', e)}
        onPointerUp={(e) => engine.onGroupPointerUp('dpad', e)}
        onPointerCancel={(e) => engine.onGroupPointerUp('dpad', e)}
      >
        {settings.dpadStyle === 'stick' ? (
          <Box className="touch-stick">
            <Box className="touch-stick__ring" />
            <Box className="touch-stick__DirectionMarks">
              <Text className="touch-stick__mark touch-stick__mark--up">▲</Text>
              <Text className="touch-stick__mark touch-stick__mark--down">▼</Text>
              <Text className="touch-stick__mark touch-stick__mark--left">◀</Text>
              <Text className="touch-stick__mark touch-stick__mark--right">▶</Text>
            </Box>
            <Box
              ref={engine.registerStickRef}
              className="touch-stick__thumb"
            />
          </Box>
        ) : (
          <Box className="touch-dpad">
            <Box className="touch-dpad__ring" />
            <Box
              ref={(el) => engine.registerBtnRef('Up', el)}
              className="touch-dpad__arm touch-dpad__arm--up"
            >
              <Text className="touch-dpad__arrow">▲</Text>
            </Box>
            <Box
              ref={(el) => engine.registerBtnRef('Down', el)}
              className="touch-dpad__arm touch-dpad__arm--down"
            >
              <Text className="touch-dpad__arrow">▼</Text>
            </Box>
            <Box
              ref={(el) => engine.registerBtnRef('Left', el)}
              className="touch-dpad__arm touch-dpad__arm--left"
            >
              <Text className="touch-dpad__arrow">◀</Text>
            </Box>
            <Box
              ref={(el) => engine.registerBtnRef('Right', el)}
              className="touch-dpad__arm touch-dpad__arm--right"
            >
              <Text className="touch-dpad__arrow">▶</Text>
            </Box>
            <Box className="touch-dpad__pivot" />
          </Box>
        )}
        {editing ? <Text className="touch-group__badge">D-Pad</Text> : null}
      </Box>

      {engine.floatingOrigin.active && settings.dpadMode === 'floating' ? (
        <Box
          className="touch-floating-dpad"
          style={{
            left: `${engine.floatingOrigin.x}px`,
            top: `${engine.floatingOrigin.y}px`,
          }}
        >
          <Box
            className="touch-floating-dpad__knob"
            style={{
              transform: `translate3d(${engine.floatingOrigin.dx}px, ${engine.floatingOrigin.dy}px, 0px)`,
            }}
          />
        </Box>
      ) : null}
    </>
  );
};

export { TouchDpadGroup };
