/**
 * @layer renderer @kind component
 * Painel de opções (encaixe na tela de Settings > Controls do app).
 */
import { useState } from 'react';
import type { TouchControls } from './engine';
import type { TouchSettings } from './types';

export function TouchControlsSettings({ engine }: { engine: TouchControls | null }) {
  const [s, setS] = useState<TouchSettings | null>(engine?.settings ?? null);
  const [editing, setEditing] = useState(false);
  if (!engine || !s) return null;
  const set = (p: Partial<TouchSettings>) => { engine.update(p); setS(engine.settings); };
  const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '6px 0' } as const;

  return (
    <section aria-label="Controle na tela">
      <h3>Controle na tela</h3>
      <label style={row}>Ativar<input type="checkbox" checked={s.enabled} onChange={e => set({ enabled: e.target.checked })} /></label>
      <label style={row}>Opacidade {Math.round(s.opacity * 100)}%
        <input type="range" min={0.1} max={1} step={0.05} value={s.opacity} onChange={e => set({ opacity: +e.target.value })} /></label>
      <label style={row}>Tamanho {Math.round(s.scale * 100)}%
        <input type="range" min={0.6} max={1.6} step={0.05} value={s.scale} onChange={e => set({ scale: +e.target.value })} /></label>
      <label style={row}>D-pad
        <select value={s.dpadMode} onChange={e => set({ dpadMode: e.target.value as TouchSettings['dpadMode'] })}>
          <option value="fixed">Fixo</option><option value="floating">Flutuante</option>
        </select></label>
      <label style={row}>Zona morta do D-pad {Math.round(s.dpadDeadzone * 100)}%
        <input type="range" min={0} max={0.5} step={0.01} value={s.dpadDeadzone} onChange={e => set({ dpadDeadzone: +e.target.value })} /></label>
      <label style={row}>Sensibilidade diagonal {s.diagonalArc}°
        <input type="range" min={20} max={70} step={1} value={s.diagonalArc} onChange={e => set({ diagonalArc: +e.target.value })} /></label>
      <label style={row}>Vibração<input type="checkbox" checked={s.haptics} onChange={e => set({ haptics: e.target.checked })} /></label>
      <label style={row}>Combo entre botões<input type="checkbox" checked={s.buttonCombos} onChange={e => set({ buttonCombos: e.target.checked })} /></label>
      <label style={row}>Esconder com controle físico<input type="checkbox" checked={s.hideWithGamepad} onChange={e => set({ hideWithGamepad: e.target.checked })} /></label>
      <label style={row}>Saída
        <select value={s.sink} onChange={e => set({ sink: e.target.value as TouchSettings['sink'] })}>
          <option value="gamepad">Gamepad virtual (recomendado)</option><option value="keyboard">Teclado</option>
        </select></label>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={() => { engine.setEditing(!editing); setEditing(!editing); }}>{editing ? 'Concluir' : 'Editar layout'}</button>
        <button onClick={() => engine.resetLayout()}>Restaurar padrão</button>
      </div>
    </section>
  );
}
