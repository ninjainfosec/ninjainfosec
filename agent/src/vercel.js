// Minimal Vercel deploy client over the REST API. Zero deps (Node fetch + crypto).
// Real deploy when VERCEL_TOKEN is set; otherwise returns a dry-run plan.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const API = "https://api.vercel.com";

function team() {
  const id = process.env.VERCEL_TEAM_ID;
  return id ? `?teamId=${id}` : "";
}

function auth() {
  const token = process.env.VERCEL_TOKEN;
  return { Authorization: `Bearer ${token}` };
}

// Walk a directory into [{ file, abs, sha, size }] with sha1 digests.
export function collectFiles(dir) {
  const out = [];
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const abs = join(d, name);
      const st = statSync(abs);
      if (st.isDirectory()) {
        if (name === "node_modules" || name === ".next" || name === ".git") continue;
        walk(abs);
      } else {
        const data = readFileSync(abs);
        const sha = createHash("sha1").update(data).digest("hex");
        out.push({ file: relative(dir, abs).split(sep).join("/"), abs, sha, size: st.size, data });
      }
    }
  };
  walk(dir);
  return out;
}

async function uploadFile(f) {
  const res = await fetch(`${API}/v2/files${team()}`, {
    method: "POST",
    headers: { ...auth(), "Content-Type": "application/octet-stream", "x-vercel-digest": f.sha },
    body: f.data,
  });
  if (!res.ok) throw new Error(`upload ${f.file} failed: ${res.status} ${await res.text()}`);
}

async function createDeployment(name, files, target) {
  const body = {
    name,
    files: files.map((f) => ({ file: f.file, sha: f.sha, size: f.size })),
    projectSettings: { framework: "nextjs" },
    ...(target === "production" ? { target: "production" } : {}),
  };
  const res = await fetch(`${API}/v13/deployments${team()}`, {
    method: "POST",
    headers: { ...auth(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`deploy failed: ${res.status} ${JSON.stringify(json)}`);
  return json; // { id, url, ... }
}

async function poll(id, { tries = 60, intervalMs = 5000 } = {}) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(`${API}/v13/deployments/${id}${team()}`, { headers: auth() });
    const j = await res.json();
    if (j.readyState === "READY") return j;
    if (j.readyState === "ERROR" || j.readyState === "CANCELED") {
      throw new Error(`deployment ${j.readyState}`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("deployment timed out");
}

// Deploy a directory. target: "preview" (default) | "production".
export async function deploy(dir, name, target = "preview", { onLog } = {}) {
  const files = collectFiles(dir);
  const totalKb = Math.round(files.reduce((n, f) => n + f.size, 0) / 1024);

  if (!process.env.VERCEL_TOKEN) {
    return {
      dryRun: true,
      target,
      name,
      fileCount: files.length,
      totalKb,
      files: files.map((f) => ({ file: f.file, sha: f.sha, size: f.size })),
      note: "Set VERCEL_TOKEN (and optionally VERCEL_TEAM_ID) to perform a real deploy.",
    };
  }

  onLog?.(`uploading ${files.length} files (${totalKb} KB)`);
  for (const f of files) await uploadFile(f);
  onLog?.(`creating ${target} deployment "${name}"`);
  const dep = await createDeployment(name, files, target);
  onLog?.(`build queued: https://${dep.url} (polling…)`);
  const ready = await poll(dep.id);
  return {
    dryRun: false,
    target,
    id: ready.id,
    url: `https://${ready.url || dep.url}`,
    inspectorUrl: ready.inspectorUrl || null,
  };
}
