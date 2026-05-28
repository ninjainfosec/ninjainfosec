// REAL stage. Static security scan of OUR scaffold + live header checks against
// OUR preview URL. Scope-limited to assets we built. No exploitation tooling.
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { scanStatic, checkHeaders, summarize } from "../scan.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

export async function run({ run, log }) {
  const rel = run.scaffold?.outDir;
  if (!rel) throw new Error("no scaffold output — run the scaffold stage first");
  const dir = join(ROOT, rel);
  if (!existsSync(dir)) throw new Error(`scaffold dir missing: ${rel}`);

  const findings = [];

  const stat = scanStatic(dir);
  findings.push(...stat.findings);
  log.info(`static: scanned ${stat.fileCount} files, ${stat.findings.length} finding(s)`);

  const url = run.preview && !run.preview.dryRun ? run.preview.url : null;
  if (url) {
    const hdr = await checkHeaders(url);
    findings.push(...hdr.findings);
    log.info(`headers: ${url} -> ${hdr.findings.length} finding(s)`);
  } else {
    log.dim("  headers: skipped (no live preview URL yet)");
  }

  const counts = summarize(findings);
  for (const x of findings) log.dim(`  [${x.severity}] ${x.title} — ${x.where}`);
  log[counts.high ? "warn" : "ok"](
    `summary: ${counts.high} high, ${counts.medium} medium, ${counts.low} low, ${counts.info} info`
  );

  const report = { scope: rel, counts, findings, scannedUrl: url };
  run.security = report;
  return report;
}
