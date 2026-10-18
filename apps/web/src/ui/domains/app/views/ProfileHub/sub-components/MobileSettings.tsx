/* @layer renderer-components @kind component */
/** Mobile display options and configurable on-screen Android touch controls settings. */
import type { ReactNode } from 'react';
import type { GameSettings } from '@shared/types/settings';
import { Box, Button, SegmentedControl, Slider, Text, Toggle } from '@ds/primitives';
import { SettingsLayout } from '../../../compounds/SettingsLayout';
import { openVanillaSafeSettings } from '@app/stores/search-store';
import { DEFAULT_SETTINGS } from '@app/lib/game/settings';
import { useTouchControlsStore } from '@app/stores/touch-controls-store';
import {
  DPAD_MODE_OPTIONS,
  DPAD_STYLE_OPTIONS,
  MOBILE_SECTIONS,
  PRESET_SEGMENT_OPTIONS,
  TURBO_MODE_OPTIONS,
} from './mobile-settings-sections';

interface MobileSettingsProps {
  settings: GameSettings;
  onChange: (patch: Partial<GameSettings>) => void;
}

const pct = (v: number) => `${v}%`;

const ActionRow = (props: { label: string; description: string; cta: string; primary?: boolean; onClick: () => void }) => (
  <Box className="toggle">
    <Box className="toggle__text">
      <Text className="toggle__label">{props.label}</Text>
      <Text className="toggle__description">{props.description}</Text>
    </Box>
    <Button variant={props.primary ? 'primary' : 'secondary'} size="sm" onClick={props.onClick}>{props.cta}</Button>
  </Box>
);

const MobileSettings = (props: MobileSettingsProps) => {
  const { settings, onChange } = props;
  const touch = useTouchControlsStore((s) => s.settings);
  const updateTouch = useTouchControlsStore((s) => s.updateSettings);
  const applyPreset = useTouchControlsStore((s) => s.applyPreset);
  const resetAll = useTouchControlsStore((s) => s.resetAll);
  const setEditing = useTouchControlsStore((s) => s.setEditing);
  const disabled = !touch.enabled;

  const renderControl = (key: string): ReactNode | null => {
    switch (key) {
      case 'touch.enabled':
        return <Toggle label="On-Screen Touch Controls" description="Show the virtual SNES gamepad overlay on touch screens during gameplay." checked={touch.enabled} onChange={(enabled) => updateTouch({ enabled })} />;
      case 'touch.editLayout':
        return <ActionRow label="Interactive Layout Editor" description="Drag, resize, hide or snap individual buttons directly on the screen with alignment guides." cta="Edit Layout" primary onClick={() => { updateTouch({ enabled: true }); setEditing(true); }} />;
      case 'touch.preset':
        return <SegmentedControl label="Layout Preset" description="Choose an ergonomic button arrangement or switch to Custom by dragging controls in the Layout Editor." value={touch.preset} options={PRESET_SEGMENT_OPTIONS} onChange={applyPreset} disabled={disabled} />;
      case 'touch.opacity':
        return <Slider label="Control Opacity" description="Transparency of the on-screen touch controls while playing." value={Math.round(touch.opacity * 100)} min={15} max={100} step={5} formatValue={pct} onChange={(v) => updateTouch({ opacity: v / 100 })} disabled={disabled} />;
      case 'touch.scale':
        return <Slider label="Global Control Size" description="Scale all on-screen buttons and the directional pad together." value={Math.round(touch.scale * 100)} min={60} max={160} step={5} formatValue={pct} onChange={(v) => updateTouch({ scale: v / 100 })} disabled={disabled} />;
      case 'touch.haptics':
        return <Toggle label="Touch Haptic Feedback" description="Short tactile pulse when pressing or sliding across on-screen buttons." checked={touch.haptics} onChange={(haptics) => updateTouch({ haptics })} disabled={disabled} />;
      case 'touch.hideWithGamepad':
        return <Toggle label="Auto-Hide With Controller" description="Automatically hide the on-screen controls while a Bluetooth or USB gamepad is connected." checked={touch.hideWithGamepad} onChange={(hideWithGamepad) => updateTouch({ hideWithGamepad })} disabled={disabled} />;
      case 'touch.dpadStyle':
        return <SegmentedControl label="Directional Style" description="Switch between the classic 8-way SNES Cross D-Pad and a Virtual Analog Thumbstick." value={touch.dpadStyle} options={DPAD_STYLE_OPTIONS} onChange={(dpadStyle) => updateTouch({ dpadStyle })} disabled={disabled} />;
      case 'touch.dpadMode':
        return <SegmentedControl label="Directional Anchor Mode" description="Fixed keeps the center stationary. Floating centers the directional pad wherever your thumb first touches its zone." value={touch.dpadMode} options={DPAD_MODE_OPTIONS} onChange={(dpadMode) => updateTouch({ dpadMode })} disabled={disabled} />;
      case 'touch.dpadDeadzone':
        return <Slider label="Center Deadzone" description="How far from the center your thumb must move before a direction registers." value={Math.round(touch.dpadDeadzone * 100)} min={5} max={40} step={1} formatValue={pct} onChange={(v) => updateTouch({ dpadDeadzone: v / 100 })} disabled={disabled} />;
      case 'touch.diagonalArc':
        return <Slider label="Diagonal Zone Width" description="Angular width (in degrees) of the four diagonal corners. Wider makes diagonal movement easier to hold." value={touch.diagonalArc} min={24} max={68} step={2} formatValue={(v) => `${v} deg`} onChange={(diagonalArc) => updateTouch({ diagonalArc })} disabled={disabled} />;
      case 'touch.buttonCombos':
        return <Toggle label="Slide and Multi-Button Combos" description="Slide your thumb smoothly between A, B, X and Y, or press the border between two adjacent buttons to hold both at once (such as B+Y)." checked={touch.buttonCombos} onChange={(buttonCombos) => updateTouch({ buttonCombos })} disabled={disabled} />;
      case 'touch.showTurbo':
        return <Toggle label="Show Fast-Forward Button" description="Display an on-screen Fast-Forward (Turbo) button for speeding up gameplay." checked={touch.showTurbo} onChange={(showTurbo) => updateTouch({ showTurbo })} disabled={disabled} />;
      case 'touch.turboMode':
        return <SegmentedControl label="Fast-Forward Button Mode" description="Hold keeps Fast-Forward active only while pressed; Toggle switches it on and off with each tap." value={touch.turboMode} options={TURBO_MODE_OPTIONS} onChange={(turboMode) => updateTouch({ turboMode })} disabled={disabled || !touch.showTurbo} />;
      case 'touch.showMenuButton':
        return <Toggle label="Show Quick Menu Button" description="Display an on-screen Menu button that opens the mobile Options drawer." checked={touch.showMenuButton} onChange={(showMenuButton) => updateTouch({ showMenuButton })} disabled={disabled} />;
      case 'touch.resetAll':
        return <ActionRow label="Reset Touch Controls" description="Restore all touch control settings, sizes and positions to their factory defaults." cta="Reset Defaults" onClick={resetAll} />;
      default:
        return null;
    }
  };

  return (
    <SettingsLayout
      sections={MOBILE_SECTIONS}
      settings={settings}
      defaults={DEFAULT_SETTINGS}
      onChange={onChange}
      renderControl={renderControl}
      onOpenVanillaSafeSettings={openVanillaSafeSettings}
    />
  );
};

export { MobileSettings };
