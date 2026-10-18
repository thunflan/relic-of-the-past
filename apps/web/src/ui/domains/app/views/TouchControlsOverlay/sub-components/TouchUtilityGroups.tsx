/* @layer renderer-components @kind component */
/** Shoulder buttons (L/R), Start/Select pills, Fast-Forward (Turbo), and Quick Menu buttons. */
import { Box, Text } from '@ds/primitives';
import type { SnesButton } from '@shared/types/controls';
import { useTouchControlsStore } from '@app/stores/touch-controls-store';
import type { TouchGroupId } from '@app/stores/touch-controls-presets';
import type { TouchEngineResult } from '../TouchControlsOverlay.type';

interface TouchUtilityGroupsProps {
  engine: TouchEngineResult;
}

interface SingleSnesGroupConfig {
  group: TouchGroupId;
  snes: SnesButton;
  label: string;
  variantClass: string;
}

const SNES_UTILITY_GROUPS: readonly SingleSnesGroupConfig[] = [
  { group: 'l', snes: 'L', label: 'L', variantClass: 'touch-pill--shoulder' },
  { group: 'r', snes: 'R', label: 'R', variantClass: 'touch-pill--shoulder' },
  { group: 'select', snes: 'Select', label: 'SELECT', variantClass: 'touch-pill--system' },
  { group: 'start', snes: 'Start', label: 'START', variantClass: 'touch-pill--system' },
];

const TouchUtilityGroups = (props: TouchUtilityGroupsProps) => {
  const { engine } = props;
  const settings = useTouchControlsStore((s) => s.settings);
  const editing = useTouchControlsStore((s) => s.editing);
  const selectedGroup = useTouchControlsStore((s) => s.selectedGroup);
  const activeLayout = useTouchControlsStore((s) =>
    engine.orientation === 'portrait' ? s.portrait : s.landscape,
  );

  const showTurboGroup =
    editing || (settings.showTurbo && activeLayout.turbo.visible);
  const showMenuGroup =
    editing || (settings.showMenuButton && activeLayout.menu.visible);

  return (
    <>
      {SNES_UTILITY_GROUPS.map(({ group, snes, label, variantClass }) => {
        const pos = activeLayout[group];
        if (!pos.visible && !editing) return null;
        const isSelected = editing && selectedGroup === group;
        const cls = [
          'touch-group',
          !pos.visible ? 'touch-group--hidden-preview' : '',
          isSelected ? 'touch-group--selected' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <Box
            key={group}
            className={cls}
            style={engine.groupStyle(group)}
            onPointerDown={(e) => engine.onGroupPointerDown(group, e)}
            onPointerMove={(e) => engine.onGroupPointerMove(group, e)}
            onPointerUp={(e) => engine.onGroupPointerUp(group, e)}
            onPointerCancel={(e) => engine.onGroupPointerUp(group, e)}
          >
            <Box
              ref={(el) => engine.registerBtnRef(snes, el)}
              className={`touch-pill ${variantClass}`}
            >
              <Text className="touch-pill__label">{label}</Text>
            </Box>
            {editing ? <Text className="touch-group__badge">{label}</Text> : null}
          </Box>
        );
      })}

      {showTurboGroup ? (
        <Box
          className={[
            'touch-group',
            !activeLayout.turbo.visible || !settings.showTurbo
              ? 'touch-group--hidden-preview'
              : '',
            editing && selectedGroup === 'turbo' ? 'touch-group--selected' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={engine.groupStyle('turbo')}
          onPointerDown={engine.onTurboPointerDown}
          onPointerMove={(e) => engine.onGroupPointerMove('turbo', e)}
          onPointerUp={engine.onTurboPointerUp}
          onPointerCancel={engine.onTurboPointerUp}
        >
          <Box
            className={`touch-pill touch-pill--aux ${engine.turboActive ? 'is-pressed' : ''}`}
          >
            <Text className="touch-pill__label">⏩</Text>
          </Box>
          {editing ? <Text className="touch-group__badge">Turbo</Text> : null}
        </Box>
      ) : null}

      {showMenuGroup ? (
        <Box
          className={[
            'touch-group',
            !activeLayout.menu.visible || !settings.showMenuButton
              ? 'touch-group--hidden-preview'
              : '',
            editing && selectedGroup === 'menu' ? 'touch-group--selected' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={engine.groupStyle('menu')}
          onPointerDown={engine.onMenuTrigger}
          onPointerMove={(e) => engine.onGroupPointerMove('menu', e)}
          onPointerUp={(e) => engine.onGroupPointerUp('menu', e)}
          onPointerCancel={(e) => engine.onGroupPointerUp('menu', e)}
        >
          <Box className="touch-pill touch-pill--aux">
            <Text className="touch-pill__label">☰</Text>
          </Box>
          {editing ? <Text className="touch-group__badge">Menu</Text> : null}
        </Box>
      ) : null}
    </>
  );
};

export { TouchUtilityGroups };
