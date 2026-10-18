/* @layer renderer-components @kind component */
/** Floating HUD toolbar for the interactive on-screen touch controls layout editor. */
import { Box, Button, Text } from '@ds/primitives';
import { TOUCH_GROUP_LABELS } from '@app/stores/touch-controls-presets';
import type { TouchOrientation } from '@app/stores/touch-controls-presets';
import { useTouchControlsStore } from '@app/stores/touch-controls-store';
import { PRESET_OPTIONS } from '../TouchControlsOverlay.constants';

interface TouchEditorToolbarProps {
  orientation: TouchOrientation;
}

const TouchEditorToolbar = (props: TouchEditorToolbarProps) => {
  const { orientation } = props;
  const settings = useTouchControlsStore((s) => s.settings);
  const selectedGroup = useTouchControlsStore((s) => s.selectedGroup) ?? 'dpad';
  const activeMap = useTouchControlsStore((s) =>
    orientation === 'portrait' ? s.portrait : s.landscape,
  );
  const updateGroupPos = useTouchControlsStore((s) => s.updateGroupPos);
  const updateSettings = useTouchControlsStore((s) => s.updateSettings);
  const applyPreset = useTouchControlsStore((s) => s.applyPreset);
  const resetLayout = useTouchControlsStore((s) => s.resetLayout);
  const setEditing = useTouchControlsStore((s) => s.setEditing);

  const selectedPos = activeMap[selectedGroup];
  const scalePct = Math.round(selectedPos.scale * 100);

  const adjustScale = (delta: number) => {
    const next = Math.round((selectedPos.scale + delta) * 100) / 100;
    updateGroupPos(orientation, selectedGroup, { scale: next });
  };

  const toggleGroupVisible = () => {
    updateGroupPos(orientation, selectedGroup, { visible: !selectedPos.visible });
  };

  return (
    <Box
      className="touch-editor-bar"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Box className="touch-editor-bar__row">
        <Text className="touch-editor-bar__title">
          Layout Editor ({orientation})
        </Text>
        <Box className="touch-editor-bar__presets">
          {PRESET_OPTIONS.map((p) => (
            <Button
              key={p.id}
              variant={settings.preset === p.id ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => applyPreset(p.id)}
            >
              {p.label}
            </Button>
          ))}
        </Box>
      </Box>

      <Box className="touch-editor-bar__row">
        <Text className="touch-editor-bar__selected">
          Selected: {TOUCH_GROUP_LABELS[selectedGroup]} ({scalePct}%)
        </Text>
        <Box className="touch-editor-bar__actions">
          <Button variant="secondary" size="sm" onClick={() => adjustScale(-0.08)}>
            Size -
          </Button>
          <Button variant="secondary" size="sm" onClick={() => adjustScale(0.08)}>
            Size +
          </Button>
          <Button
            variant={selectedPos.visible ? 'secondary' : 'ghost'}
            size="sm"
            onClick={toggleGroupVisible}
          >
            {selectedPos.visible ? 'Visible' : 'Hidden'}
          </Button>
          <Button
            variant={settings.snapToGrid ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => updateSettings({ snapToGrid: !settings.snapToGrid })}
          >
            {settings.snapToGrid ? 'Grid: On' : 'Grid: Off'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => resetLayout(orientation)}>
            Reset
          </Button>
          <Button variant="primary" size="sm" onClick={() => setEditing(false)}>
            Done
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export { TouchEditorToolbar };
