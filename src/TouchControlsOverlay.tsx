/**
 * @layer renderer @kind component
 * Wrapper React. Monte UMA vez na tela de jogo (ao lado do <canvas>).
 *   <TouchControlsOverlay />                // auto: só aparece em Android/touch
 *   <TouchControlsOverlay sink={meuSink} /> // se preferir chamar um export Wasm* direto
 */
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { TouchControls } from './engine';
import type { InputSink, TouchSettings } from './types';
import './touch-controls.css';

export function isTouchPlatform(): boolean {
  const cap = (window as Window & { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  if (cap?.getPlatform?.() === 'android') return true;
  return matchMedia('(pointer: coarse)').matches && navigator.maxTouchPoints > 0;
}

export interface TouchControlsOverlayProps {
  sink?: InputSink;
  settings?: Partial<TouchSettings>;
  /** força exibir mesmo fora do Android (útil para debug no desktop) */
  force?: boolean;
}

export const TouchControlsOverlay = forwardRef<TouchControls | null, TouchControlsOverlayProps>(
  function TouchControlsOverlay({ sink, settings, force }, ref) {
    const hostRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<TouchControls | null>(null);
    useImperativeHandle(ref, () => engineRef.current as TouchControls, []);

    useEffect(() => {
      if (!hostRef.current || (!force && !isTouchPlatform())) return;
      engineRef.current = new TouchControls(hostRef.current, { sink, settings });
      return () => { engineRef.current?.destroy(); engineRef.current = null; };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sink, force]);

    return <div ref={hostRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />;
  },
);
