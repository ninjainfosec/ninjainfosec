// STUB. GO-LIVE GATE. Real run promotes to prod and points the domain at it.
//   mcp__vercel__deploy_to_vercel (target: production)
export async function run({ run, log }) {
  log.warn("production: STUB — go-live is the final human gate before real traffic.");
  const artifact = {
    domain: run.domain?.desired || null,
    productionUrl: null, // filled after deploy_to_vercel(production)
    live: false,
    todo: ["deploy_to_vercel(production)", "alias domain", "verify TLS + DNS propagation"],
  };
  run.production = artifact;
  return artifact;
}
