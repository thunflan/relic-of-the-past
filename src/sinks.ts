/**
 * @layer renderer @kind module
 * Destinos de entrada do overlay.
 *
 * 1) VirtualGamepadSink (padrão): injeta um gamepad "standard" na Gamepad API do
 *    WebView. Emscripten/SDL3 lê navigator.getGamepads(), então o toque passa pela
 *    MESMA camada de controle (remapeamento, turbo, etc.) que um controle físico.
 * 2) KeyboardSink (fallback): dispara KeyboardEvents com o mapeamento padrão do zelda3.
 * 3) Qualquer objeto que implemente InputSink (ex.: chamada direta a um export Wasm*).
 */
import type { ButtonId, InputSink } from './types';

// Índices do mapeamento "standard" (W3C). Posição física SNES -> posição standard.
const STD_INDEX: Record<ButtonId, number> = {
  B: 0,      // sul
  A: 1,      // leste
  Y: 2,      // oeste
  X: 3,      // norte
  L: 4, R: 5,
  SELECT: 8, START: 9,
  UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15,
};

interface VButton { pressed: boolean; touched: boolean; value: number; }

export class VirtualGamepadSink implements InputSink {
  static readonly ID = 'Relic Touch Controller (STANDARD GAMEPAD Vendor: 0000 Product: 0000)';
  private buttons: VButton[] = Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 }));
  private axes = [0, 0, 0, 0];
  private index = 0;
  private connected = false;
  private timestamp = performance.now();
  private original?: () => (Gamepad | null)[];

  private snapshot(): Gamepad {
    return {
      id: VirtualGamepadSink.ID,
      index: this.index,
      connected: this.connected,
      mapping: 'standard',
      timestamp: this.timestamp,
      axes: this.axes.slice(),
      buttons: this.buttons.map(b => ({ ...b })),
      vibrationActuator: null,
      hapticActuators: [],
    } as unknown as Gamepad;
  }

  connect(): void {
    if (this.connected) return;
    const nav = navigator as Navigator & { __rotpOrigGetGamepads?: () => (Gamepad | null)[] };
    this.original = nav.__rotpOrigGetGamepads ?? navigator.getGamepads?.bind(navigator) ?? (() => []);
    nav.__rotpOrigGetGamepads = this.original;
    const real = Array.from(this.original());
    // primeiro slot livre: não colide com controles físicos
    this.index = real.findIndex(p => !p);
    if (this.index < 0) this.index = real.length;
    this.connected = true;
    const self = this;
    navigator.getGamepads = function (): (Gamepad | null)[] {
      const list = Array.from(self.original!());
      while (list.length <= self.index) list.push(null);
      if (self.connected) list[self.index] = self.snapshot();
      return list;
    } as typeof navigator.getGamepads;
    this.fire('gamepadconnected');
  }

  disconnect(): void {
    if (!this.connected) return;
    this.buttons.forEach(b => { b.pressed = b.touched = false; b.value = 0; });
    this.connected = false;
    this.fire('gamepaddisconnected');
    if (this.original) navigator.getGamepads = this.original as typeof navigator.getGamepads;
  }

  setButton(id: ButtonId, pressed: boolean): void {
    const b = this.buttons[STD_INDEX[id]];
    if (b.pressed === pressed) return;
    b.pressed = b.touched = pressed;
    b.value = pressed ? 1 : 0;
    this.timestamp = performance.now();
  }

  private fire(type: string): void {
    const ev = new Event(type);
    Object.defineProperty(ev, 'gamepad', { value: this.snapshot() });
    window.dispatchEvent(ev);
  }
}

/** Mapeamento de teclado padrão do zelda3 (snesrev). Ajuste se o app tiver outro. */
export const ZELDA3_DEFAULT_KEYS: Record<ButtonId, { key: string; code: string; keyCode: number }> = {
  UP:     { key: 'ArrowUp',    code: 'ArrowUp',    keyCode: 38 },
  DOWN:   { key: 'ArrowDown',  code: 'ArrowDown',  keyCode: 40 },
  LEFT:   { key: 'ArrowLeft',  code: 'ArrowLeft',  keyCode: 37 },
  RIGHT:  { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
  A:      { key: 'x', code: 'KeyX', keyCode: 88 },
  B:      { key: 'z', code: 'KeyZ', keyCode: 90 },
  X:      { key: 's', code: 'KeyS', keyCode: 83 },
  Y:      { key: 'a', code: 'KeyA', keyCode: 65 },
  L:      { key: 'c', code: 'KeyC', keyCode: 67 },
  R:      { key: 'v', code: 'KeyV', keyCode: 86 },
  SELECT: { key: 'Shift', code: 'ShiftRight', keyCode: 16 },
  START:  { key: 'Enter', code: 'Enter', keyCode: 13 },
};

export class KeyboardSink implements InputSink {
  private down = new Set<ButtonId>();
  constructor(
    private target: EventTarget = window,
    private keys: Record<ButtonId, { key: string; code: string; keyCode: number }> = ZELDA3_DEFAULT_KEYS,
  ) {}
  connect(): void { /* nada */ }
  disconnect(): void { [...this.down].forEach(id => this.setButton(id, false)); }
  setButton(id: ButtonId, pressed: boolean): void {
    if (pressed === this.down.has(id)) return;
    pressed ? this.down.add(id) : this.down.delete(id);
    const k = this.keys[id];
    const ev = new KeyboardEvent(pressed ? 'keydown' : 'keyup', { key: k.key, code: k.code, bubbles: true, cancelable: true });
    // Emscripten antigo ainda lê keyCode/which
    Object.defineProperty(ev, 'keyCode', { get: () => k.keyCode });
    Object.defineProperty(ev, 'which', { get: () => k.keyCode });
    this.target.dispatchEvent(ev);
  }
}
