// Attach a hero image (local path or URL) to a run's generated project.
import { mkdirSync, copyFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export async function attachHero(run, source) {
  if (!run.scaffold?.outDir) throw new Error("run has no scaffold output yet — run the scaffold stage first");
  const publicDir = join(ROOT, run.scaffold.outDir, "public");
  mkdirSync(publicDir, { recursive: true });
  const dest = join(publicDir, "hero.png");

  if (/^https?:\/\//.test(source)) {
    const res = await fetch(source);
    if (!res.ok) throw new Error(`download failed: ${res.status} ${res.statusText}`);
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  } else {
    const abs = isAbsolute(source) ? source : join(process.cwd(), source);
    if (!existsSync(abs)) throw new Error(`file not found: ${abs}`);
    copyFileSync(abs, dest);
  }

  run.design = run.design || {};
  run.design.heroAsset = "/hero.png";
  return dest;
}
