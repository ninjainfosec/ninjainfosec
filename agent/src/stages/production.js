// REAL stage. GO-LIVE GATE. Promotes the scaffolded site to a PRODUCTION Vercel
// deploy ONLY when ALLOW_GO_LIVE=1 is set (never automatically).
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { deploy } from "../vercel.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

export async function run({ run, log }) {
  const rel = run.scaffold?.outDir;
  const dir = rel ? join(ROOT, rel) : null;
  if (!dir || !existsSync(dir)) throw new Error("no scaffold output to promote");

  const name = (run.briefStructured?.slug || "site").replace(/[^a-z0-9-]/g, "").slice(0, 52);

  if (process.env.ALLOW_GO_LIVE !== "1") {
    log.warn("HOLD: go-live not authorized. Set ALLOW_GO_LIVE=1 to promote to production.");
    const artifact = { live: false, reason: "ALLOW_GO_LIVE not set", domain: run.domain?.desired || null };
    run.production = artifact;
    return artifact;
  }

  log.warn(`ALLOW_GO_LIVE=1 — promoting "${name}" to PRODUCTION`);
  const result = await deploy(dir, name, "production", { onLog: (m) => log.dim("  " + m) });
  const artifact = {
    live: !result.dryRun,
    url: result.url || null,
    domain: run.domain?.desired || null,
    note: result.dryRun ? "needs VERCEL_TOKEN" : "point your domain's records at this deployment",
  };
  if (result.dryRun) log.warn("DRY-RUN: set VERCEL_TOKEN to actually go live.");
  else log.ok(`LIVE: ${result.url}`);
  run.production = artifact;
  return artifact;
}
