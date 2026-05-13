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

## Render to video

The reveal can be captured as a WebM with a one-shot headless Chromium recording.

```bash
npm run record:setup    # one-time: download chromium (~150 MB)
npm run record          # builds, captures 24s, writes ./out/maison-nox-reveal.webm
```

Defaults: 1920×1080, 24 seconds, port 3041. Override via env:

```bash
WIDTH=2560 HEIGHT=1440 DURATION=24 npm run record
```

To convert the WebM to MP4 (requires `ffmpeg`):

```bash
ffmpeg -i out/maison-nox-reveal.webm -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p out/maison-nox-reveal.mp4
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
