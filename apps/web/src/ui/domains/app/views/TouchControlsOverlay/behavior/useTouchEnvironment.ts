/* @layer renderer-components @kind hook */
/** Environment detection (orientation, physical gamepad presence, and InputManager touchActive sync). */
import { useEffect, useState } from 'react';
import { useCapability } from '@app/platform';
import { getInputManager } from '@app/lib/input/input-manager';
import { setTurboHeld } from '@app/lib/game/turbo';
import type { TouchOrientation } from '@app/stores/touch-controls-presets';

interface TouchEnvironmentParams {
  enabled: boolean;
  hideWithGamepad: boolean;
  editing: boolean;
  gameRunning: boolean;
  pageOpen: boolean;
}

interface TouchEnvironmentState {
  visible: boolean;
  orientation: TouchOrientation;
}

const detectOrientation = (): TouchOrientation =>
  typeof window !== 'undefined' && window.innerHeight > window.innerWidth
    ? 'portrait'
    : 'landscape';

const useTouchEnvironment = (params: TouchEnvironmentParams): TouchEnvironmentState => {
  const { enabled, hideWithGamepad, editing, gameRunning, pageOpen } = params;
  const hostTouchCapable = useCapability('touchControls');
  const [orientation, setOrientation] = useState<TouchOrientation>(detectOrientation);
  const [hasGamepad, setHasGamepad] = useState<boolean>(() =>
    getInputManager()
      .getDevices()
      .some((d) => d.type === 'gamepad' && d.connected),
  );

  useEffect(() => {
    const onResize = () => setOrientation(detectOrientation());
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  useEffect(() => {
    const mgr = getInputManager();
    setHasGamepad(mgr.getDevices().some((d) => d.type === 'gamepad' && d.connected));
    return mgr.onDeviceChange((devices) => {
      setHasGamepad(devices.some((d) => d.type === 'gamepad' && d.connected));
    });
  }, []);

  const deviceHasTouch =
    hostTouchCapable ||
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0);

  const activeForInput = deviceHasTouch && enabled && !(hideWithGamepad && hasGamepad);
  const visible = editing || (activeForInput && gameRunning && !pageOpen);

  useEffect(() => {
    const mgr = getInputManager();
    mgr.setTouchActive(activeForInput || editing);
    return () => {
      mgr.setTouchActive(false);
    };
  }, [activeForInput, editing]);

  useEffect(() => {
    if (!visible || editing) {
      getInputManager().clearTouchInput();
      setTurboHeld(false);
    }
  }, [visible, editing]);

  return { visible, orientation };
};

export { useTouchEnvironment };
