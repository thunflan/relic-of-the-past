/**
 * @layer renderer @kind module
 * Motor do controle na tela — independente de framework (o wrapper React só monta/desmonta).
 *
 * Decisões de UX (padrões mais aceitos em RetroArch, Delta, Lemuroid, Snes9x EX+):
 *  - Multitoque real via Pointer Events + pointer capture; nada de re-render por frame.
 *  - "Slide" entre botões: arrastar o dedo de B para A troca o botão sem levantar o dedo.
 *  - Área de toque maior que o desenho do botão (hit-slop), e combo ao tocar entre dois.
 *  - D-pad 8 direções por ângulo, com zona morta e setor diagonal configurável;
 *    modo fixo ou flutuante (o centro nasce onde o polegar encosta).
 *  - Semi-transparente, respeita safe-area/notch, some quando um controle físico conecta
 *    e volta ao tocar na tela.
 *  - Vibração curta no press; modo de edição para arrastar e salvar a posição.
 */
import type { ButtonId, ControlPos, InputSink, Layout, TouchSettings } from './types';
import { DEFAULT_LANDSCAPE, DEFAULT_PORTRAIT, DEFAULT_SETTINGS, STORAGE_KEY } from './defaults';
import { KeyboardSink, VirtualGamepadSink } from './sinks';
import { tick } from './haptics';

type Group = keyof Layout;
type Dir = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface Hit { id: ButtonId; cx: number; cy: number; r: number; }
interface Track { group: Group; held: Set<ButtonId>; startX: number; startY: number; ox?: number; oy?: number; }

interface Persisted { settings: TouchSettings; landscape: Layout; portrait: Layout; }

const FACE_LABELS: Record<'A' | 'B' | 'X' | 'Y', [number, number]> = {
  X: [0, -1], A: [1, 0], B: [0, 1], Y: [-1, 0],
};

export class TouchControls {
  readonly root: HTMLDivElement;
  private els = {} as Record<Group, HTMLDivElement>;
  private btnEls = new Map<ButtonId, HTMLElement>();
  private hits = new Map<Group, Hit[]>();
  private tracks = new Map<number, Track>();
  private refCount = new Map<ButtonId, number>();
  private sink!: InputSink;
  private customSink?: InputSink;
  private data: Persisted;
  private editing = false;
  private hiddenByPad = false;
  private ro?: ResizeObserver;
  private listeners: Array<() => void> = [];

  constructor(private host: HTMLElement, opts: { sink?: InputSink; settings?: Partial<TouchSettings> } = {}) {
    this.data = this.load();
    if (opts.settings) Object.assign(this.data.settings, opts.settings);
    this.customSink = opts.sink;
    this.root = document.createElement('div');
    this.root.className = 'rotp-touch';
    this.root.setAttribute('aria-hidden', 'true');
    this.build();
    host.appendChild(this.root);
    this.useSink();
    this.bind();
    this.apply();
  }

  // ---------- API pública ----------
  get settings(): TouchSettings { return { ...this.data.settings }; }

  update(patch: Partial<TouchSettings>): void {
    const sinkChanged = patch.sink && patch.sink !== this.data.settings.sink;
    Object.assign(this.data.settings, patch);
    if (sinkChanged) { this.releaseAll(); this.sink.disconnect(); this.useSink(); }
    if (patch.enabled === false) { this.releaseAll(); this.sink.disconnect(); }
    if (patch.enabled === true) this.sink.connect();
    this.save(); this.apply();
  }

  setEditing(on: boolean): void {
    this.editing = on; this.releaseAll();
    this.root.classList.toggle('rotp-editing', on);
    if (!on) this.save();
  }

  resetLayout(): void {
    this.data.landscape = structuredClone(DEFAULT_LANDSCAPE);
    this.data.portrait = structuredClone(DEFAULT_PORTRAIT);
    this.save(); this.apply();
  }

  destroy(): void {
    this.releaseAll();
    this.sink.disconnect();
    this.listeners.forEach(off => off());
    this.ro?.disconnect();
    this.root.remove();
  }

  // ---------- construção ----------
  private build(): void {
    const mk = (cls: string, parent: HTMLElement = this.root, text = ''): HTMLDivElement => {
      const d = document.createElement('div'); d.className = cls; if (text) d.textContent = text; parent.appendChild(d); return d;
    };
    const dpad = mk('rotp-ctl rotp-dpad');
    const cross = mk('rotp-dpad-cross', dpad);
    (['UP', 'DOWN', 'LEFT', 'RIGHT'] as Dir[]).forEach(d => this.btnEls.set(d, mk(`rotp-dpad-arm rotp-${d.toLowerCase()}`, cross)));
    mk('rotp-dpad-hub', cross);
    this.els.dpad = dpad;

    const face = mk('rotp-ctl rotp-face');
    (Object.keys(FACE_LABELS) as Array<keyof typeof FACE_LABELS>).forEach(id => {
      this.btnEls.set(id, mk(`rotp-btn rotp-btn-${id.toLowerCase()}`, face, id));
    });
    this.els.face = face;

    (['L', 'R'] as const).forEach(id => {
      const el = mk(`rotp-ctl rotp-shoulder rotp-shoulder-${id.toLowerCase()}`, this.root, id);
      this.els[id] = el; this.btnEls.set(id, el);
    });
    (['SELECT', 'START'] as const).forEach(id => {
      const el = mk('rotp-ctl rotp-pill', this.root, id === 'START' ? 'START' : 'SELECT');
      this.els[id] = el; this.btnEls.set(id, el);
    });
  }

  private useSink(): void {
    this.sink = this.customSink ?? (this.data.settings.sink === 'keyboard' ? new KeyboardSink() : new VirtualGamepadSink());
    if (this.data.settings.enabled) this.sink.connect();
  }

  private bind(): void {
    const on = <K extends keyof WindowEventMap>(t: Window | HTMLElement, ev: K, fn: (e: WindowEventMap[K]) => void, o?: AddEventListenerOptions) => {
      t.addEventListener(ev, fn as EventListener, o);
      this.listeners.push(() => t.removeEventListener(ev, fn as EventListener, o));
    };
    const opts = { passive: false } as AddEventListenerOptions;
    (Object.keys(this.els) as Group[]).forEach(g => {
      on(this.els[g], 'pointerdown', e => this.down(e, g), opts);
      on(this.els[g], 'pointermove', e => this.move(e), opts);
      on(this.els[g], 'pointerup', e => this.up(e), opts);
      on(this.els[g], 'pointercancel', e => this.up(e), opts);
      on(this.els[g], 'lostpointercapture', e => this.up(e), opts);
    });
    on(this.root, 'contextmenu', e => e.preventDefault(), opts);
    on(window, 'resize', () => this.apply());
    on(window, 'orientationchange', () => this.apply());
    on(window, 'blur', () => this.releaseAll());
    on(document as unknown as HTMLElement, 'visibilitychange' as keyof WindowEventMap, () => { if (document.hidden) this.releaseAll(); });

    // controle físico: esconde; toque na tela: volta
    on(window, 'gamepadconnected', (e: Event) => {
      const gp = (e as GamepadEvent).gamepad;
      if (gp && gp.id !== VirtualGamepadSink.ID && this.data.settings.hideWithGamepad) { this.hiddenByPad = true; this.releaseAll(); this.apply(); }
    });
    on(window, 'touchstart', () => { if (this.hiddenByPad) { this.hiddenByPad = false; this.apply(); } }, { passive: true });

    this.ro = new ResizeObserver(() => this.measure());
    this.ro.observe(this.host);
  }

  // ---------- layout ----------
  private get portrait(): boolean { return window.innerHeight > window.innerWidth; }
  private get layout(): Layout { return this.portrait ? this.data.portrait : this.data.landscape; }
  private get unit(): number { return Math.min(window.innerWidth, window.innerHeight) / 100; }

  private apply(): void {
    const s = this.data.settings;
    const visible = s.enabled && !this.hiddenByPad;
    this.root.style.display = visible ? '' : 'none';
    this.root.style.setProperty('--rotp-opacity', String(s.opacity));
    this.root.classList.toggle('rotp-portrait', this.portrait);
    const u = this.unit;
    (Object.keys(this.els) as Group[]).forEach(g => this.place(this.els[g], this.layout[g], u * s.scale, u));
    requestAnimationFrame(() => this.measure());
  }

  private place(el: HTMLElement, p: ControlPos, su: number, u: number): void {
    const size = p.size * su;
    el.style.width = el.style.height = `${size}px`;
    if (el.classList.contains('rotp-pill')) el.style.height = `${size * 0.42}px`;
    if (el.classList.contains('rotp-shoulder')) el.style.height = `${size * 0.48}px`;
    el.style.left = el.style.right = el.style.top = el.style.bottom = el.style.transform = '';
    const x = `${p.x * u}px`, y = `${p.y * u}px`;
    const sl = 'env(safe-area-inset-left, 0px)', sr = 'env(safe-area-inset-right, 0px)', sb = 'env(safe-area-inset-bottom, 0px)', st = 'env(safe-area-inset-top, 0px)';
    switch (p.anchor) {
      case 'bl': el.style.left = `calc(${x} + ${sl})`; el.style.bottom = `calc(${y} + ${sb})`; break;
      case 'br': el.style.right = `calc(${x} + ${sr})`; el.style.bottom = `calc(${y} + ${sb})`; break;
      case 'tl': el.style.left = `calc(${x} + ${sl})`; el.style.top = `calc(${y} + ${st})`; break;
      case 'tr': el.style.right = `calc(${x} + ${sr})`; el.style.top = `calc(${y} + ${st})`; break;
      case 'bc': el.style.left = `calc(50% + ${x})`; el.style.bottom = `calc(${y} + ${sb})`; el.style.transform = 'translateX(-50%)'; break;
    }
  }

  /** Cache de círculos de acerto (evita getBoundingClientRect a cada pointermove). */
  private measure(): void {
    this.hits.clear();
    const slop = 1.3; // hit-slop: área de toque 30% maior que o desenho
    const circ = (id: ButtonId, el: Element, k = slop): Hit => {
      const r = el.getBoundingClientRect();
      return { id, cx: r.left + r.width / 2, cy: r.top + r.height / 2, r: Math.max(r.width, r.height) / 2 * k };
    };
    this.hits.set('face', (['A', 'B', 'X', 'Y'] as const).map(id => circ(id, this.btnEls.get(id)!)));
    (['L', 'R', 'START', 'SELECT'] as const).forEach(id => this.hits.set(id, [circ(id, this.els[id], 1.15)]));
  }

  // ---------- entrada ----------
  private down(e: PointerEvent, g: Group): void {
    e.preventDefault(); e.stopPropagation();
    const el = e.currentTarget as HTMLElement;
    try { el.setPointerCapture(e.pointerId); } catch { /* ok */ }
    const t: Track = { group: g, held: new Set(), startX: e.clientX, startY: e.clientY };
    if (this.editing) {
      const r = el.getBoundingClientRect(); t.ox = r.left; t.oy = r.top;
      this.tracks.set(e.pointerId, t); return;
    }
    this.tracks.set(e.pointerId, t);
    if (g === 'dpad' && this.data.settings.dpadMode === 'floating') {
      // centro nasce onde o polegar encostou
      t.ox = e.clientX; t.oy = e.clientY;
      const r = this.els.dpad.getBoundingClientRect();
      this.cross().style.transform = `translate(${e.clientX - (r.left + r.width / 2)}px, ${e.clientY - (r.top + r.height / 2)}px)`;
    }
    this.resolve(e, t, true);
  }

  private move(e: PointerEvent): void {
    const t = this.tracks.get(e.pointerId); if (!t) return;
    e.preventDefault();
    if (this.editing) { this.drag(e, t); return; }
    for (const ev of (e.getCoalescedEvents?.() ?? [e]).slice(-1)) this.resolve(ev, t, false);
  }

  private up(e: PointerEvent): void {
    const t = this.tracks.get(e.pointerId); if (!t) return;
    this.tracks.delete(e.pointerId);
    if (this.editing) { this.commitDrag(t); return; }
    t.held.forEach(id => this.release(id));
    t.held.clear();
    if (t.group === 'dpad') this.cross().style.transform = '';
  }

  private cross(): HTMLElement { return this.els.dpad.firstElementChild as HTMLElement; }

  private resolve(e: PointerEvent, t: Track, first: boolean): void {
    const next = t.group === 'dpad' ? this.dpadDirs(e, t) : this.buttonsAt(e.clientX, e.clientY, t.group);
    // slide: se saiu de todos os botões do grupo após o primeiro toque, mantém o último (evita "cair" do botão)
    if (!first && next.size === 0 && t.group !== 'dpad' && t.group !== 'face') return;
    t.held.forEach(id => { if (!next.has(id)) { this.release(id); t.held.delete(id); } });
    let pressedNew = false;
    next.forEach(id => { if (!t.held.has(id)) { this.press(id); t.held.add(id); pressedNew = true; } });
    if (pressedNew && this.data.settings.haptics) tick(t.group === 'START' || t.group === 'SELECT');
  }

  private dpadDirs(e: PointerEvent, t: Track): Set<ButtonId> {
    const r = this.els.dpad.getBoundingClientRect();
    const cx = t.ox ?? r.left + r.width / 2, cy = t.oy ?? r.top + r.height / 2;
    const dx = e.clientX - cx, dy = e.clientY - cy;
    const radius = r.width / 2;
    const out = new Set<ButtonId>();
    if (Math.hypot(dx, dy) < radius * this.data.settings.dpadDeadzone) return out;
    // ângulo 0° = direita, sentido horário (y da tela cresce para baixo)
    const ang = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
    const half = this.data.settings.diagonalArc / 2;
    const near = (c: number) => { const d = Math.abs(((ang - c + 540) % 360) - 180); return d; };
    const card: Array<[number, Dir]> = [[0, 'RIGHT'], [90, 'DOWN'], [180, 'LEFT'], [270, 'UP']];
    const diag: Array<[number, Dir, Dir]> = [[45, 'RIGHT', 'DOWN'], [135, 'DOWN', 'LEFT'], [225, 'LEFT', 'UP'], [315, 'UP', 'RIGHT']];
    const d = diag.find(([c]) => near(c) <= half);
    if (d) { out.add(d[1]); out.add(d[2]); }
    else out.add(card.reduce((a, b) => (near(a[0]) < near(b[0]) ? a : b))[1]);
    return out;
  }

  private buttonsAt(x: number, y: number, g: Group): Set<ButtonId> {
    const hits = this.hits.get(g) ?? [];
    const inside = hits.map(h => ({ h, d: Math.hypot(x - h.cx, y - h.cy) / h.r })).filter(o => o.d <= 1).sort((a, b) => a.d - b.d);
    const out = new Set<ButtonId>();
    if (!inside.length) return out;
    out.add(inside[0].h.id);
    // combo: dedo na fronteira entre dois botões vizinhos (ex.: B+Y, B+A)
    if (g === 'face' && this.data.settings.buttonCombos && inside[1] && inside[1].d - inside[0].d < 0.12) out.add(inside[1].h.id);
    return out;
  }

  private press(id: ButtonId): void {
    const n = (this.refCount.get(id) ?? 0) + 1; this.refCount.set(id, n);
    if (n === 1) { this.sink.setButton(id, true); this.btnEls.get(id)?.classList.add('rotp-on'); }
  }
  private release(id: ButtonId): void {
    const n = Math.max(0, (this.refCount.get(id) ?? 0) - 1); this.refCount.set(id, n);
    if (n === 0) { this.sink.setButton(id, false); this.btnEls.get(id)?.classList.remove('rotp-on'); }
  }
  private releaseAll(): void {
    this.tracks.forEach(t => t.held.forEach(id => this.release(id)));
    this.tracks.clear();
    this.refCount.forEach((_, id) => { this.refCount.set(id, 0); this.sink?.setButton(id, false); this.btnEls.get(id)?.classList.remove('rotp-on'); });
  }

  // ---------- modo edição ----------
  private drag(e: PointerEvent, t: Track): void {
    const el = this.els[t.group];
    el.style.left = `${t.ox! + e.clientX - t.startX}px`;
    el.style.top = `${t.oy! + e.clientY - t.startY}px`;
    el.style.right = el.style.bottom = el.style.transform = '';
  }
  private commitDrag(t: Track): void {
    const el = this.els[t.group];
    const r = el.getBoundingClientRect(), u = this.unit, W = window.innerWidth, H = window.innerHeight;
    const p = this.layout[t.group];
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    // reancora no canto mais próximo para sobreviver a mudança de resolução
    const left = cx < W / 2, top = cy < H / 2;
    if (p.anchor === 'bc') { p.x = (cx - W / 2) / u; p.y = (H - r.bottom) / u; }
    else {
      p.anchor = `${top ? 't' : 'b'}${left ? 'l' : 'r'}` as ControlPos['anchor'];
      p.x = (left ? r.left : W - r.right) / u;
      p.y = (top ? r.top : H - r.bottom) / u;
    }
    this.save(); this.apply();
  }

  // ---------- persistência ----------
  private load(): Persisted {
    const base: Persisted = { settings: { ...DEFAULT_SETTINGS }, landscape: structuredClone(DEFAULT_LANDSCAPE), portrait: structuredClone(DEFAULT_PORTRAIT) };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return base;
      const p = JSON.parse(raw) as Partial<Persisted>;
      return {
        settings: { ...base.settings, ...p.settings },
        landscape: { ...base.landscape, ...p.landscape },
        portrait: { ...base.portrait, ...p.portrait },
      };
    } catch { return base; }
  }
  private save(): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data)); } catch { /* quota */ }
  }
}
