import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = join(HERE, "..", "pipeline.config.json");

export function loadConfig() {
  return JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
}

// Resolve each stage's module to its exported `run` function.
export async function loadStages(config) {
  const stages = [];
  for (const def of config.stages) {
    const mod = await import(new URL(def.module, import.meta.url));
    stages.push({ ...def, run: mod.run });
  }
  return stages;
}
