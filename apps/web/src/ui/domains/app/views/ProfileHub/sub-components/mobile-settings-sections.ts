/* @layer renderer-components @kind data */
/** Sections and searchable items for the Mobile settings tab (cutout + on-screen touch controls). */
import type { Section } from '../../../compounds/SettingsLayout';
import { MOBILE_SECTION } from './SettingsView.constants';

const TOUCH_CONTROLS_SECTION: Section = {
  id: 'touch-controls',
  title: 'Touch Controls',
  subsections: [
    {
      id: 'touch-general',
      title: 'Overlay and Layout',
      items: [
        {
          key: 'touch.enabled',
          label: 'On-Screen Touch Controls',
          description: 'Show the virtual SNES gamepad overlay on touch screens during gameplay.',
          keywords: 'touch controls overlay virtual gamepad android mobile buttons on-screen',
        },
        {
          key: 'touch.editLayout',
          label: 'Interactive Layout Editor',
          description: 'Drag, resize, hide or snap individual buttons directly on the screen with alignment guides.',
          keywords: 'touch layout editor move drag position resize customize buttons',
        },
        {
          key: 'touch.preset',
          label: 'Layout Preset',
          description: 'Choose an ergonomic button arrangement or switch to Custom by dragging controls in the Layout Editor.',
          keywords: 'touch preset layout standard compact high grip custom',
        },
        {
          key: 'touch.opacity',
          label: 'Control Opacity',
          description: 'Transparency of the on-screen touch controls while playing.',
          keywords: 'touch opacity transparency alpha visibility fade',
        },
        {
          key: 'touch.scale',
          label: 'Global Control Size',
          description: 'Scale all on-screen buttons and the directional pad together.',
          keywords: 'touch scale size zoom larger smaller buttons',
        },
        {
          key: 'touch.haptics',
          label: 'Touch Haptic Feedback',
          description: 'Short tactile pulse when pressing or sliding across on-screen buttons.',
          keywords: 'touch haptics vibration buzz tactile feedback',
        },
        {
          key: 'touch.hideWithGamepad',
          label: 'Auto-Hide With Controller',
          description: 'Automatically hide the on-screen controls while a Bluetooth or USB gamepad is connected.',
          keywords: 'touch auto hide controller gamepad bluetooth usb',
        },
      ],
    },
    {
      id: 'touch-dpad',
      title: 'Directional Pad and Stick',
      items: [
        {
          key: 'touch.dpadStyle',
          label: 'Directional Style',
          description: 'Switch between the classic 8-way SNES Cross D-Pad and a Virtual Analog Thumbstick.',
          keywords: 'dpad stick analog cross directional style thumbstick',
        },
        {
          key: 'touch.dpadMode',
          label: 'Directional Anchor Mode',
          description: 'Fixed keeps the center stationary. Floating centers the directional pad wherever your thumb first touches its zone.',
          keywords: 'dpad floating fixed anchor origin dynamic',
        },
        {
          key: 'touch.dpadDeadzone',
          label: 'Center Deadzone',
          description: 'How far from the center your thumb must move before a direction registers.',
          keywords: 'dpad deadzone neutral center sensitivity',
        },
        {
          key: 'touch.diagonalArc',
          label: 'Diagonal Zone Width',
          description: 'Angular width (in degrees) of the four diagonal corners. Wider makes diagonal movement easier to hold.',
          keywords: 'dpad diagonal angle arc corner sensitivity',
        },
      ],
    },
    {
      id: 'touch-buttons',
      title: 'Action and Utility Buttons',
      items: [
        {
          key: 'touch.buttonCombos',
          label: 'Slide and Multi-Button Combos',
          description: 'Slide your thumb smoothly between A, B, X and Y, or press the border between two adjacent buttons to hold both at once (such as B+Y).',
          keywords: 'combos chord slide multi button abxy roll',
        },
        {
          key: 'touch.showTurbo',
          label: 'Show Fast-Forward Button',
          description: 'Display an on-screen Fast-Forward (Turbo) button for speeding up gameplay.',
          keywords: 'turbo fast forward speed button',
        },
        {
          key: 'touch.turboMode',
          label: 'Fast-Forward Button Mode',
          description: 'Hold keeps Fast-Forward active only while pressed; Toggle switches it on and off with each tap.',
          keywords: 'turbo mode hold toggle fast forward',
        },
        {
          key: 'touch.showMenuButton',
          label: 'Show Quick Menu Button',
          description: 'Display an on-screen Menu button that opens the mobile Options drawer.',
          keywords: 'menu options drawer button mobile',
        },
        {
          key: 'touch.resetAll',
          label: 'Reset Touch Controls',
          description: 'Restore all touch control settings, sizes and positions to their factory defaults.',
          keywords: 'reset touch controls defaults layout restore',
        },
      ],
    },
  ],
};

const PRESET_SEGMENT_OPTIONS: { value: 'standard' | 'compact' | 'high' | 'custom'; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'compact', label: 'Compact' },
  { value: 'high', label: 'High Grip' },
  { value: 'custom', label: 'Custom' },
];

const DPAD_STYLE_OPTIONS: { value: 'cross' | 'stick'; label: string }[] = [
  { value: 'cross', label: '8-Way Cross D-Pad' },
  { value: 'stick', label: 'Virtual Analog Stick' },
];

const DPAD_MODE_OPTIONS: { value: 'fixed' | 'floating'; label: string }[] = [
  { value: 'fixed', label: 'Fixed Position' },
  { value: 'floating', label: 'Floating Touch Origin' },
];

const TURBO_MODE_OPTIONS: { value: 'hold' | 'toggle'; label: string }[] = [
  { value: 'hold', label: 'Hold' },
  { value: 'toggle', label: 'Toggle' },
];

const MOBILE_SECTIONS: Section[] = [MOBILE_SECTION, TOUCH_CONTROLS_SECTION];

export {
  TOUCH_CONTROLS_SECTION,
  MOBILE_SECTIONS,
  PRESET_SEGMENT_OPTIONS,
  DPAD_STYLE_OPTIONS,
  DPAD_MODE_OPTIONS,
  TURBO_MODE_OPTIONS,
};
