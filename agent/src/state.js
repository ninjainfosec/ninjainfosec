import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const RUNS_DIR = join(ROOT, "runs");

export function runPath(id) {
  return join(RUNS_DIR, `${id}.json`);
}

export function loadRun(id) {
  const p = runPath(id);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8"));
}

export function saveRun(run) {
  if (!existsSync(RUNS_DIR)) mkdirSync(RUNS_DIR, { recursive: true });
  run.updatedAt = new Date().toISOString();
  writeFileSync(runPath(run.id), JSON.stringify(run, null, 2));
  return run;
}

// The "current" run is simply the most recently updated one.
export function latestRunId() {
  if (!existsSync(RUNS_DIR)) return null;
  const files = readdirSync(RUNS_DIR).filter((f) => f.endsWith(".json"));
  if (files.length === 0) return null;
  let newest = null;
  let newestTime = -1;
  for (const f of files) {
    const r = JSON.parse(readFileSync(join(RUNS_DIR, f), "utf8"));
    const t = Date.parse(r.updatedAt || r.createdAt || 0);
    if (t > newestTime) {
      newestTime = t;
      newest = r.id;
    }
  }
  return newest;
}

export function newRun(brief, stages, stack) {
  const id = `run-${Date.now().toString(36)}`;
  return {
    id,
    brief,
    stack,
    createdAt: new Date().toISOString(),
    currentStage: 0,
    stages: stages.map((s) => ({
      id: s.id,
      name: s.name,
      gate: s.gate,
      status: "pending", // pending -> awaiting_approval -> approved | rejected
      artifact: null,
      note: null,
    })),
  };
}
