/** @layer renderer @kind module — vibração curta ao pressionar (Capacitor Haptics > navigator.vibrate). */
type CapWin = Window & { Capacitor?: { Plugins?: { Haptics?: { impact(o: { style: string }): Promise<void> } } } };

export function tick(strong = false): void {
  const h = (window as CapWin).Capacitor?.Plugins?.Haptics;
  if (h) { h.impact({ style: strong ? 'MEDIUM' : 'LIGHT' }).catch(() => {}); return; }
  try { navigator.vibrate?.(strong ? 14 : 8); } catch { /* sem suporte */ }
}
