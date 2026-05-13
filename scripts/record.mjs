// Headless cinematic capture for the MAISON NOX reveal.
//
//   npm run record:setup   # one-time: download chromium
//   npm run record         # builds next, captures 24s, saves WebM
//
// Env overrides:
//   WIDTH=2560 HEIGHT=1440 PORT=3091 DURATION=24 npm run record
//
// Output: ./out/maison-nox-reveal.webm
//
// We record 24s instead of 22s so the held legacy frame breathes for 1.5s
// after the final sweep before the recording ends.

import { spawn } from "node:child_process";
import { mkdir, rm, rename, stat } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const PORT = Number(process.env.PORT ?? 3041);
const URL = `http://127.0.0.1:${PORT}`;
const WIDTH = Number(process.env.WIDTH ?? 1920);
const HEIGHT = Number(process.env.HEIGHT ?? 1080);
const DURATION_S = Number(process.env.DURATION ?? 24);
const OUT_DIR = path.resolve("out");
const FINAL = path.join(OUT_DIR, "maison-nox-reveal.webm");

function log(msg) {
  process.stdout.write(`\x1b[38;5;221m▸\x1b[0m ${msg}\n`);
}

async function waitForServer(url, timeoutMs = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // server not up yet
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Server never became ready at ${url}`);
}

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  log(`launching next start on :${PORT}`);
  const server = spawn("npx", ["--yes", "next", "start", "-p", String(PORT)], {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PORT: String(PORT) },
  });
  server.stdout.on("data", (d) => process.stdout.write(`\x1b[2m[next]\x1b[0m ${d}`));
  server.stderr.on("data", (d) => process.stderr.write(`\x1b[2m[next]\x1b[0m ${d}`));

  const cleanup = () => {
    if (!server.killed) server.kill("SIGTERM");
  };
  process.on("SIGINT", () => {
    cleanup();
    process.exit(130);
  });

  try {
    await waitForServer(URL);
    log(`server ready · launching chromium @ ${WIDTH}×${HEIGHT}`);

    const browser = await chromium.launch({
      args: ["--disable-blink-features=AutomationControlled"],
    });
    const context = await browser.newContext({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1,
      colorScheme: "dark",
      reducedMotion: "no-preference",
      recordVideo: { dir: OUT_DIR, size: { width: WIDTH, height: HEIGHT } },
    });
    const page = await context.newPage();

    await page.goto(URL, { waitUntil: "networkidle" });
    // Give fonts + first frame a beat to settle so the open frame isn't blank.
    await page.waitForTimeout(400);

    log(`recording ${DURATION_S}s`);
    await page.waitForTimeout(DURATION_S * 1000);

    const video = page.video();
    await context.close();
    await browser.close();

    const tmp = await video?.path();
    if (!tmp) throw new Error("playwright produced no video file");
    await rename(tmp, FINAL);

    const { size } = await stat(FINAL);
    log(`saved ${path.relative(process.cwd(), FINAL)} · ${(size / 1024 / 1024).toFixed(1)} MB`);
  } finally {
    cleanup();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
