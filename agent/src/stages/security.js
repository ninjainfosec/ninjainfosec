// STUB. Static + own-asset only. Real run drives /security-review and scanners.
// SCOPE: only the site we just built / its own preview URL. No third-party targets.
export async function run({ run, log }) {
  log.warn("security: STUB — returns a checklist; real run executes scans on OUR preview only.");
  const report = {
    scope: run.briefStructured?.slug || "site",
    checks: [
      { id: "deps-cve", desc: "npm audit / dependency CVEs", status: "todo" },
      { id: "headers", desc: "CSP, HSTS, X-Frame-Options, etc.", status: "todo" },
      { id: "authz", desc: "auth & access-control misconfig", status: "todo" },
      { id: "owasp", desc: "OWASP top-10 against own preview URL", status: "todo" },
      { id: "secrets", desc: "leaked secrets / .env exposure", status: "todo" },
    ],
    findings: [],
    note: "Live pentesting is restricted to assets you own and authorize.",
  };
  run.security = report;
  log.info(`${report.checks.length} checks queued for ${report.scope}`);
  return report;
}
