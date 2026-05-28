// REAL stage. Generates a coherent design system from the brief that the
// scaffold consumes. Brand imagery (heroAsset) is filled by the image-gen MCP
// as an optional, approved layer; until then a gradient hero renders.
import { chooseSystem } from "../design.js";

export async function run({ run, log }) {
  const b = run.briefStructured || { slug: "site", title: "Untitled", pages: ["home"] };
  const design = chooseSystem(b);
  run.design = design;

  log.info(`category: ${design.category} (${design.theme}, ${design.mood})`);
  log.info(`fonts: ${design.fonts.heading} / ${design.fonts.body}`);
  log.info(`accent: ${design.colors.accent}`);
  log.dim(`  hero prompt: ${design.heroImagePrompt}`);
  log.dim("  (run image-gen to fill heroAsset; gradient hero renders meanwhile)");
  return design;
}
