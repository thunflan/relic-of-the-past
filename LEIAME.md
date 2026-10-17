# Controle na tela (Android) — Relic of the Past

Overlay de toque nativo para a versão Android (Capacitor + React + WASM) do
[drizztdourden08/relic-of-the-past](https://github.com/drizztdourden08/relic-of-the-past).

## O que vem pronto
| Recurso | Padrão adotado (RetroArch / Delta / Lemuroid) |
|---|---|
| Layout | D-pad à esquerda, losango SNES (X topo, A direita, B baixo, Y esquerda) à direita, L/R nos cantos, Select/Start embaixo no centro |
| Paisagem e retrato | Layouts separados, respeitando notch/safe-area |
| Multitoque | Pointer Events + pointer capture; D-pad e botões ao mesmo tempo |
| Deslizar entre botões | Arrastar de B para A troca sem levantar o dedo |
| Combo | Tocar entre dois botões aperta os dois (ex.: B+A) |
| D-pad | 8 direções por ângulo, zona morta e arco diagonal ajustáveis; modo **fixo** ou **flutuante** |
| Área de toque | 30% maior que o desenho do botão |
| Feedback | Vibração curta (Capacitor Haptics, senão `navigator.vibrate`) + realce visual |
| Controle físico | Some ao conectar um gamepad e volta ao tocar na tela |
| Personalização | Opacidade, tamanho, editor de layout por arrasto, restaurar padrão (salvo em `localStorage`) |
| Desempenho | Sem re-render React por toque; acertos em cache; zero dependências |

## Como a entrada chega ao jogo
**Padrão: gamepad virtual.** O overlay registra um gamepad `standard` na Gamepad API do WebView.
O SDL3/Emscripten lê `navigator.getGamepads()`, então o toque passa pela **mesma camada de controle**
do projeto (remapeamento, turbo, perfis), igual a um controle físico.

Alternativas:
- `sink: 'keyboard'`: envia as teclas padrão do zelda3 (setas, X/Z/S/A, C/V, Enter, Shift).
- `sink` customizado: implemente `InputSink.setButton(id, pressed)` chamando um export `Wasm*` de input, se o core tiver um.

## Integração (4 passos)
1. Copie `src/` para `shared/` (ou para a pasta do renderer), ex.: `shared/renderer/touch-controls/`.
2. Na tela do jogo, ao lado do `<canvas>`:
   ```tsx
   import { TouchControlsOverlay } from '@/touch-controls';
   const tcRef = useRef<TouchControls | null>(null);
   <TouchControlsOverlay ref={tcRef} />   // só aparece no Android/touch
   ```
3. Em Configurações > Controles: `<TouchControlsSettings engine={tcRef.current} />`.
4. Android nativo (`android-native/`): adicione a permissão `VIBRATE` e mescle o `MainActivity.snippet.java`
   (tela cheia imersiva, tela sempre ligada, sem overscroll nem long-press no WebView).
   Garanta `viewport-fit=cover` na meta viewport do `index.html`.

## Gerar o APK
- **Local:** `npm ci` → build web do mobile → `cd apps/mobile && npx cap sync android` →
  `cd android && ./gradlew assembleDebug` → `app/build/outputs/apk/debug/app-debug.apk`.
- **GitHub Actions (sem instalar nada):** copie `ci/android-touch-apk.yml` para `.github/workflows/`,
  ajuste o comando de build web marcado com `>>>`, faça push na branch `feat/touch-controls`
  e baixe o APK em *Actions › Artifacts*.

## Testar sem o celular
Abra `demo/demo-standalone.html` no Chrome com DevTools › modo dispositivo (touch).
A tela mostra o que o "SDL" está lendo da Gamepad API em tempo real.

## Validação feita
Teste automatizado com multitoque (Chromium, 915×412 e 412×915): press, slide B→A, combo B+A,
D-pad + botões simultâneos, diagonal, zona morta, soltura total, Start, D-pad flutuante e
registro do gamepad `standard` — todos OK, sem erros de console. TypeScript `strict` sem erros no motor.
