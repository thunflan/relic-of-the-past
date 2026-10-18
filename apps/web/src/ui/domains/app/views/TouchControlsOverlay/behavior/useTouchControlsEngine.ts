/* @layer renderer-components @kind hook */
/** Multi-touch pointer engine and interactive layout drag editor for TouchControlsOverlay. */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SnesButton } from '@shared/types/controls';
import { getInputManager } from '@app/lib/input/input-manager';
import { setTurboHeld } from '@app/lib/game/turbo';
import { useTouchControlsStore } from '@app/stores/touch-controls-store';
import type { TouchControlPos, TouchGroupId } from '@app/stores/touch-controls-presets';
import { GROUP_DIMENSIONS } from '../TouchControlsOverlay.constants';
import { ALL_SNES_BUTTONS, evaluateGroupPointer, triggerHaptic } from './dpad-math';
import { buildGroupStyle, computeDraggedPos } from './layout-math';
import { useTouchEnvironment } from './useTouchEnvironment';
import type { FloatingDpadOrigin, TouchEngineResult } from '../TouchControlsOverlay.type';

interface ActivePointer {
  group: TouchGroupId;
  buttons: SnesButton[];
  originX: number;
  originY: number;
  radius: number;
}

interface DragSession {
  pointerId: number;
  group: TouchGroupId;
  startClientX: number;
  startClientY: number;
  startPos: TouchControlPos;
}

const INITIAL_FLOATING: FloatingDpadOrigin = { active: false, x: 0, y: 0, dx: 0, dy: 0 };

const useTouchControlsEngine = (gameRunning: boolean, pageOpen: boolean): TouchEngineResult => {
  const settings = useTouchControlsStore((s) => s.settings);
  const landscape = useTouchControlsStore((s) => s.landscape);
  const portrait = useTouchControlsStore((s) => s.portrait);
  const editing = useTouchControlsStore((s) => s.editing);
  const updateGroupPos = useTouchControlsStore((s) => s.updateGroupPos);
  const setSelectedGroup = useTouchControlsStore((s) => s.setSelectedGroup);

  const { visible, orientation } = useTouchEnvironment({
    enabled: settings.enabled,
    hideWithGamepad: settings.hideWithGamepad,
    editing,
    gameRunning,
    pageOpen,
  });

  const activeLayout = orientation === 'portrait' ? portrait : landscape;
  const pointersRef = useRef<Map<number, ActivePointer>>(new Map());
  const pressedSetRef = useRef<Set<SnesButton>>(new Set());
  const btnRefs = useRef<Map<SnesButton, HTMLElement>>(new Map());
  const stickRef = useRef<HTMLElement | null>(null);
  const dragRef = useRef<DragSession | null>(null);
  const [floatingOrigin, setFloatingOrigin] = useState<FloatingDpadOrigin>(INITIAL_FLOATING);
  const [turboActive, setTurboActive] = useState(false);

  const syncButtons = useCallback((allowHaptic: boolean) => {
    const next = new Set<SnesButton>();
    for (const ptr of pointersRef.current.values()) {
      for (const b of ptr.buttons) next.add(b);
    }
    const prev = pressedSetRef.current;
    const mgr = getInputManager();
    let newlyPressed = false;
    for (const btn of ALL_SNES_BUTTONS) {
      const isDown = next.has(btn);
      if (isDown !== prev.has(btn)) {
        mgr.setTouchButton(btn, isDown);
        btnRefs.current.get(btn)?.classList.toggle('is-pressed', isDown);
        if (isDown) newlyPressed = true;
      }
    }
    pressedSetRef.current = next;
    if (allowHaptic && newlyPressed) triggerHaptic(settings.haptics, 9);
  }, [settings.haptics]);

  useEffect(() => {
    if (!visible || editing) {
      pointersRef.current.clear();
      syncButtons(false);
      setFloatingOrigin(INITIAL_FLOATING);
      setTurboActive(false);
      if (stickRef.current) stickRef.current.style.transform = 'translate3d(0px, 0px, 0px)';
    }
  }, [visible, editing, syncButtons]);

  const applyPointerEval = useCallback((ptr: ActivePointer, clientX: number, clientY: number) => {
    const res = evaluateGroupPointer(ptr.group, ptr.originX, ptr.originY, ptr.radius, clientX, clientY, settings);
    ptr.buttons = res.buttons;
    if (ptr.group === 'dpad') {
      if (stickRef.current) stickRef.current.style.transform = `translate3d(${res.tx}px, ${res.ty}px, 0px)`;
      if (settings.dpadMode === 'floating') {
        setFloatingOrigin({ active: true, x: ptr.originX, y: ptr.originY, dx: res.tx, dy: res.ty });
      }
    }
  }, [settings]);

  const onGroupPointerDown = useCallback((group: TouchGroupId, e: React.PointerEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    if (editing) {
      setSelectedGroup(group);
      dragRef.current = { pointerId: e.pointerId, group, startClientX: e.clientX, startClientY: e.clientY, startPos: { ...activeLayout[group] } };
      triggerHaptic(settings.haptics, 8);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const radius = Math.max(24, Math.min(rect.width, rect.height) / 2);
    const isFloating = group === 'dpad' && settings.dpadMode === 'floating';
    const originX = isFloating ? e.clientX : rect.left + rect.width / 2;
    const originY = isFloating ? e.clientY : rect.top + rect.height / 2;
    const ptr: ActivePointer = { group, buttons: [], originX, originY, radius };
    applyPointerEval(ptr, e.clientX, e.clientY);
    pointersRef.current.set(e.pointerId, ptr);
    syncButtons(true);
  }, [activeLayout, applyPointerEval, editing, setSelectedGroup, settings.dpadMode, settings.haptics, syncButtons]);

  const onGroupPointerMove = useCallback((group: TouchGroupId, e: React.PointerEvent<HTMLElement>) => {
    if (editing) {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId || drag.group !== group) return;
      const nextXY = computeDraggedPos(drag.startPos, e.clientX - drag.startClientX, e.clientY - drag.startClientY, settings.snapToGrid, window.innerWidth, window.innerHeight);
      updateGroupPos(orientation, group, nextXY);
      return;
    }
    const ptr = pointersRef.current.get(e.pointerId);
    if (!ptr) return;
    applyPointerEval(ptr, e.clientX, e.clientY);
    syncButtons(true);
  }, [applyPointerEval, editing, orientation, settings.snapToGrid, syncButtons, updateGroupPos]);

  const onGroupPointerUp = useCallback((group: TouchGroupId, e: React.PointerEvent<HTMLElement>) => {
    if (editing) {
      if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
      return;
    }
    if (!pointersRef.current.delete(e.pointerId)) return;
    if (group === 'dpad') {
      if (stickRef.current) stickRef.current.style.transform = 'translate3d(0px, 0px, 0px)';
      setFloatingOrigin(INITIAL_FLOATING);
    }
    syncButtons(false);
  }, [editing, syncButtons]);

  const onTurboPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (editing) { onGroupPointerDown('turbo', e); return; }
    e.preventDefault();
    e.stopPropagation();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    triggerHaptic(settings.haptics, 10);
    const next = settings.turboMode === 'toggle' ? !turboActive : true;
    setTurboActive(next);
    setTurboHeld(next);
  }, [editing, onGroupPointerDown, settings.haptics, settings.turboMode, turboActive]);

  const onTurboPointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (editing) { onGroupPointerUp('turbo', e); return; }
    if (settings.turboMode === 'hold') { setTurboActive(false); setTurboHeld(false); }
  }, [editing, onGroupPointerUp, settings.turboMode]);

  const onMenuTrigger = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (editing) { onGroupPointerDown('menu', e); return; }
    e.preventDefault();
    e.stopPropagation();
    triggerHaptic(settings.haptics, 12);
    window.dispatchEvent(new CustomEvent('rotpback', { detail: 'right' }));
  }, [editing, onGroupPointerDown, settings.haptics]);

  const registerBtnRef = useCallback((button: SnesButton, el: HTMLElement | null) => {
    if (el) btnRefs.current.set(button, el);
    else btnRefs.current.delete(button);
  }, []);

  const registerStickRef = useCallback((el: HTMLElement | null) => { stickRef.current = el; }, []);

  const groupStyle = useCallback((group: TouchGroupId) => ({
    ...buildGroupStyle(activeLayout[group], settings.scale, group),
    '--touch-group-w': `${GROUP_DIMENSIONS[group].width}px`,
  } as React.CSSProperties), [activeLayout, settings.scale]);

  return {
    visible, orientation, floatingOrigin, turboActive, groupStyle, registerBtnRef, registerStickRef,
    onGroupPointerDown, onGroupPointerMove, onGroupPointerUp, onTurboPointerDown, onTurboPointerUp, onMenuTrigger,
  };
};

export { useTouchControlsEngine };
