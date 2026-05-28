// REAL stage. Generates a working Next.js (App Router) app + DB schema +
// architecture note into output/<slug>/. No external deps required.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chooseSystem, googleFontsHref } from "../design.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

export async function run({ run, log }) {
  const b = run.briefStructured || { slug: "site", title: "Untitled", pages: ["home"] };
  const d = run.design || chooseSystem(b);
  const outDir = join(ROOT, "output", b.slug);

  const files = buildNextApp(b, d);
  for (const [rel, content] of Object.entries(files)) {
    const p = join(outDir, rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, content);
  }

  log.ok(`Wrote ${Object.keys(files).length} files to output/${b.slug}/`);
  log.dim("  cd output/" + b.slug + " && npm install && npm run dev");
  const artifact = { outDir: `output/${b.slug}`, files: Object.keys(files) };
  run.scaffold = artifact;
  return artifact;
}

function buildNextApp(b, d) {
  const c = d.colors;
  const fontsHref = googleFontsHref(d.fonts);
  const heroBg = d.heroAsset
    ? `url('${d.heroAsset}') center/cover no-repeat`
    : d.colors.gradient;

  return {
    "package.json": JSON.stringify(
      {
        name: b.slug,
        version: "0.1.0",
        private: true,
        scripts: { dev: "next dev", build: "next build", start: "next start" },
        dependencies: { next: "^14.2.0", react: "^18.3.0", "react-dom": "^18.3.0" },
      },
      null,
      2
    ),
    "next.config.mjs": `/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Content-Security-Policy", value: "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

export default {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};
`,
    "app/layout.jsx": `import "./globals.css";

export const metadata = { title: ${JSON.stringify(b.title)}, description: "Built by the website-factory agent." };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href=${JSON.stringify(fontsHref)} />
      </head>
      <body>{children}</body>
    </html>
  );
}
`,
    "app/page.jsx": `export default function Home() {
  return (
    <main>
      <section className="hero">
        <h1>${escapeJsx(b.title)}</h1>
        <p>${escapeJsx(d.mood)} — built by the autonomous website-factory pipeline.</p>
        <a className="cta" href="/about">Learn more</a>
      </section>
    </main>
  );
}
`,
    "app/about/page.jsx": `export default function About() {
  return <main className="hero"><h1>About</h1><p>Edit me.</p></main>;
}
`,
    "app/globals.css": `:root {
  --bg: ${c.bg};
  --surface: ${c.surface};
  --fg: ${c.fg};
  --muted: ${c.muted};
  --accent: ${c.accent};
  --accent-fg: ${c.accentFg};
  --border: ${c.border};
  --radius: ${d.radius};
  --font-heading: "${d.fonts.heading}", system-ui, sans-serif;
  --font-body: "${d.fonts.body}", system-ui, sans-serif;
}
* { box-sizing: border-box; margin: 0; }
body { background: var(--bg); color: var(--fg); font-family: var(--font-body); line-height: 1.6; }
h1, h2, h3 { font-family: var(--font-heading); line-height: 1.1; }
.hero {
  min-height: 100vh;
  display: grid;
  place-content: center;
  gap: 1.25rem;
  text-align: center;
  padding: 2rem;
  background: ${heroBg};
}
.hero h1 { font-size: ${d.typeScale.h1}; }
.hero p { color: var(--muted); max-width: 42ch; margin: 0 auto; }
.cta {
  color: var(--accent-fg);
  background: var(--accent);
  padding: .8rem 1.6rem;
  border-radius: var(--radius);
  text-decoration: none;
  font-weight: 600;
  width: fit-content;
  margin: 0 auto;
}
`,
    "db/schema.sql": `-- Starter schema. Swap for Prisma/Drizzle when the data model is real.
create table if not exists contact_message (
  id          bigserial primary key,
  name        text not null,
  email       text not null,
  body        text not null,
  created_at  timestamptz not null default now()
);
`,
    "ARCHITECTURE.md": `# ${b.title} — architecture

- **Frontend:** Next.js 14 App Router, deployed to Vercel.
- **Design:** ${d.category} / ${d.theme} — fonts ${d.fonts.heading} + ${d.fonts.body}, accent ${d.colors.accent}.
- **Hero image prompt:** ${d.heroImagePrompt}
- **Data:** Postgres (\`db/schema.sql\`); add Drizzle/Prisma when needed.
- **Pages:** ${(b.pages || []).join(", ")}.
- **Security:** run the security stage against the preview URL only.
- **DNS/email:** A/CNAME at apex + SPF/DKIM/DMARC for transactional email.

Generated by the website-factory agent.
`,
    ".gitignore": `node_modules\n.next\n.env*\n`,
  };
}

function escapeJsx(s) {
  return String(s).replace(/[<>{}]/g, "");
}
