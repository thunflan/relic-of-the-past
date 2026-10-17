/**
 * @layer renderer @kind module
 * Tipos do overlay de controle na tela (Android / touch).
 */
export type ButtonId =
  | 'A' | 'B' | 'X' | 'Y' | 'L' | 'R' | 'START' | 'SELECT'
  | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type Anchor = 'tl' | 'tr' | 'bl' | 'br' | 'bc';

/** Posição em "unidades" = 1% do menor lado da tela (vmin), relativa à âncora + safe-area. */
export interface ControlPos { anchor: Anchor; x: number; y: number; size: number; }

export interface Layout {
  dpad: ControlPos;
  face: ControlPos;      // losango A/B/X/Y (size = diâmetro do conjunto)
  L: ControlPos; R: ControlPos;
  START: ControlPos; SELECT: ControlPos;
}

export interface TouchSettings {
  enabled: boolean;
  opacity: number;          // 0.1 – 1
  scale: number;            // 0.6 – 1.6
  haptics: boolean;
  dpadMode: 'fixed' | 'floating';
  dpadDeadzone: number;     // 0 – 0.5 (fração do raio)
  diagonalArc: number;      // graus do setor diagonal (30 – 60)
  hideWithGamepad: boolean;
  buttonCombos: boolean;    // tocar entre dois botões aperta os dois
  sink: 'gamepad' | 'keyboard';
}

export interface InputSink {
  setButton(id: ButtonId, pressed: boolean): void;
  connect(): void;
  disconnect(): void;
}
