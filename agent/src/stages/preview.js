// REAL stage. Deploys the scaffolded site to a Vercel PREVIEW via REST API.
// Live when VERCEL_TOKEN is set; otherwise prints a dry-run deploy plan.
import { join } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { deploy } from "../vercel.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

export async function run({ run, log }) {
  const rel = run.scaffold?.outDir;
  if (!rel) throw new Error("no scaffold output — run the scaffold stage first");
  const dir = join(ROOT, rel);
  if (!existsSync(dir)) throw new Error(`scaffold dir missing: ${rel}`);

  const name = (run.briefStructured?.slug || "site").replace(/[^a-z0-9-]/g, "").slice(0, 52);
  log.info(`deploying ${rel} -> Vercel preview as "${name}"`);

  const result = await deploy(dir, name, "preview", { onLog: (m) => log.dim("  " + m) });

  if (result.dryRun) {
    log.warn(`DRY-RUN: ${result.fileCount} files (${result.totalKb} KB) ready to deploy.`);
    log.dim("  " + result.note);
  } else {
    log.ok(`Preview live: ${result.url}`);
  }
  run.preview = result;
  return result;
}
