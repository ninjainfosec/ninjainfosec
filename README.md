# MAISON NOX

> _Not a perfume. A presence._

A 22-second cinematic brand reveal for **MAISON NOX** under
**THE MAISON WORLD — House of Distinction**.

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and Framer Motion.
All visuals — particles, monogram, perfume flacon, royal crest — are rendered
as SVG and motion primitives. No video files, no third-party assets.

## Cinematic timeline

| Scene | Time         | Beat                                      |
|------:|--------------|-------------------------------------------|
| 1     | 0s – 2s      | Darkness — gold dust barely stirs         |
| 2     | 2s – 5s      | Energy awakens at the center              |
| 3     | 5s – 8s      | The MN monogram is forged in light        |
| 4     | 8s – 11s     | Brand reveal: **MAISON NOX**              |
| 5     | 11s – 15s    | The flacon emerges from the void          |
| 6     | 15s – 18s    | _Not a perfume. A presence._              |
| 7     | 18s – 22s    | THE MAISON WORLD · House of Distinction   |

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Build

```bash
npm run build
npm start
```

## Notes on craft

- **Palette:** pure black void, deep luxury gold (`#D4AF37`), warm amber halos,
  minimal cream highlights. No neon, no aggression.
- **Motion:** every easing is the same `[0.22, 0.8, 0.2, 1]` cinematic curve.
  Movements are slow, intentional, expensive.
- **Camera:** a single 22-second drift + parallax-layered particle field gives
  every scene its sense of depth.
- **Accessibility:** respects `prefers-reduced-motion` and skips to the held
  legacy frame instead of animating.
