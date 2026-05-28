// STUB. Wire to Canva + image-gen MCP tools when running inside the agent:
//   mcp__canva__generate-design        -> layouts / pages
//   mcp__canva__export-design          -> export assets
//   <image-gen>__generate_image        -> hero / illustration assets
export async function run({ run, log }) {
  const b = run.briefStructured || {};
  log.warn("design: STUB — returns a design spec; real run calls Canva/image MCP.");

  const design = {
    fonts: { heading: "Inter", body: "Inter" },
    colors: { bg: "#0b0f17", fg: "#e6edf3", accent: "#3b82f6" },
    layout: "hero + feature-grid + cta",
    pages: b.pages || ["home"],
    assets: [], // populated by image-gen MCP in a real run
    todo: [
      "call mcp__canva__generate-design with the brief",
      "export-design to output assets",
      "generate hero image via image-gen MCP",
    ],
  };
  run.design = design;
  log.info(`palette ${design.colors.accent} on ${design.colors.bg}, font ${design.fonts.heading}`);
  return design;
}
