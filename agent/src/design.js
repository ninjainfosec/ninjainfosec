// Deterministic design-system generator. Maps a brief to a real, coherent
// design system (font pairing + palette + tokens) that the scaffold consumes.
// Brand imagery is layered on top via the image-gen MCP (optional, approved).

const CATEGORIES = [
  { keys: ["bakery", "cafe", "coffee", "restaurant", "food", "pastry", "kitchen"], heading: "Playfair Display", body: "Source Sans 3", hue: 25, theme: "light", mood: "warm and inviting" },
  { keys: ["photo", "portfolio", "art", "gallery", "studio", "creative", "wildlife"], heading: "Space Grotesk", body: "Inter", hue: 265, theme: "dark", mood: "bold and cinematic" },
  { keys: ["tech", "saas", "app", "startup", "ai", "software", "cloud", "data", "dev"], heading: "Sora", body: "Inter", hue: 215, theme: "dark", mood: "clean and modern" },
  { keys: ["law", "finance", "consult", "agency", "bank", "invest", "legal"], heading: "Lora", body: "Inter", hue: 205, theme: "light", mood: "trustworthy and professional" },
];

const DEFAULT_CAT = { heading: "Inter", body: "Inter", hue: 220, theme: "dark", mood: "minimal and crisp" };

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pickCategory(text) {
  const t = text.toLowerCase();
  for (const c of CATEGORIES) if (c.keys.some((k) => t.includes(k))) return c;
  return DEFAULT_CAT;
}

function tokens(theme, h) {
  const h2 = (h + 35) % 360;
  if (theme === "light") {
    return {
      bg: `hsl(${h} 40% 97%)`,
      surface: `hsl(${h} 30% 100%)`,
      fg: `hsl(${h} 25% 15%)`,
      muted: `hsl(${h} 12% 42%)`,
      accent: `hsl(${h} 75% 45%)`,
      accentFg: `hsl(${h} 40% 99%)`,
      border: `hsl(${h} 20% 86%)`,
      gradient: `linear-gradient(135deg, hsl(${h} 70% 90%), hsl(${h2} 70% 80%))`,
    };
  }
  return {
    bg: `hsl(${h} 30% 8%)`,
    surface: `hsl(${h} 25% 12%)`,
    fg: `hsl(${h} 15% 92%)`,
    muted: `hsl(${h} 10% 65%)`,
    accent: `hsl(${h} 80% 62%)`,
    accentFg: `hsl(${h} 35% 10%)`,
    border: `hsl(${h} 20% 22%)`,
    gradient: `linear-gradient(135deg, hsl(${h} 60% 22%), hsl(${h2} 65% 32%))`,
  };
}

export function chooseSystem(brief) {
  const text = `${brief.raw || ""} ${(brief.pages || []).join(" ")}`;
  const cat = pickCategory(text);
  const seed = hash(brief.slug || text || "site");
  const hue = (cat.hue + (seed % 24) - 12 + 360) % 360; // small deterministic variation
  const colors = tokens(cat.theme, hue);

  return {
    category: cat === DEFAULT_CAT ? "general" : cat.keys[0],
    theme: cat.theme,
    mood: cat.mood,
    fonts: { heading: cat.heading, body: cat.body },
    colors,
    radius: "0.75rem",
    typeScale: { base: "16px", h1: "clamp(2.5rem, 6vw, 4.5rem)", h2: "clamp(1.5rem, 3vw, 2.25rem)" },
    layout: "hero + feature-grid + cta",
    pages: brief.pages || ["home"],
    heroImagePrompt: `${cat.mood} hero image for "${brief.title || brief.slug}", web banner, high quality, no text`,
    heroAsset: null, // set when image-gen produces a real asset
  };
}

// Build a Google Fonts <link> href for the chosen pairing.
export function googleFontsHref(fonts) {
  const fam = (n) => `${n.replace(/ /g, "+")}:wght@400;600;700`;
  const set = [...new Set([fonts.heading, fonts.body])].map(fam).join("&family=");
  return `https://fonts.googleapis.com/css2?family=${set}&display=swap`;
}
