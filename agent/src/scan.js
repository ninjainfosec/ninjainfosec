// Zero-dep security checks. SCOPE: only our own scaffold dir + our own preview
// URL. No third-party targets, no exploitation — static analysis + header checks.
import { collectFiles } from "./vercel.js";

const SECRET_PATTERNS = [
  { id: "aws-key", re: /AKIA[0-9A-Z]{16}/, title: "AWS access key id" },
  { id: "private-key", re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, title: "Private key material" },
  { id: "generic-secret", re: /(?:api[_-]?key|secret|token|passwd|password)\s*[:=]\s*['"][A-Za-z0-9_\-]{16,}['"]/i, title: "Hardcoded secret/credential" },
];

const f = (severity, title, detail, where) => ({ severity, title, detail, where });

export function scanStatic(dir) {
  const files = collectFiles(dir);
  const findings = [];
  let hasNextHeaders = false;
  let gitignoresEnv = false;

  for (const file of files) {
    const text = file.data.toString("utf8");
    if (file.data.includes(0)) continue; // skip binary

    for (const p of SECRET_PATTERNS) {
      if (p.re.test(text)) findings.push(f("high", p.title, `Pattern ${p.id} matched`, file.file));
    }
    if (/\.env(\.|$)/.test(file.file) && !file.file.endsWith(".gitignore")) {
      findings.push(f("high", "Committed .env file", "Secrets file tracked in repo", file.file));
    }
    if (/dangerouslySetInnerHTML/.test(text)) {
      findings.push(f("medium", "Raw HTML injection sink", "dangerouslySetInnerHTML present — XSS risk", file.file));
    }
    if (file.file === "next.config.mjs" && /async\s+headers\s*\(/.test(text)) hasNextHeaders = true;
    if (file.file === ".gitignore" && /\.env/.test(text)) gitignoresEnv = true;
  }

  if (!hasNextHeaders) {
    findings.push(f("medium", "No security headers configured", "next.config has no headers() — add CSP, HSTS, X-Frame-Options, X-Content-Type-Options", "next.config.mjs"));
  }
  if (!gitignoresEnv) {
    findings.push(f("low", ".env not gitignored", "Add .env* to .gitignore to avoid leaking secrets", ".gitignore"));
  }
  return { fileCount: files.length, findings };
}

const EXPECTED_HEADERS = [
  ["strict-transport-security", "high", "HSTS missing — allows protocol downgrade"],
  ["content-security-policy", "high", "CSP missing — primary XSS mitigation absent"],
  ["x-frame-options", "medium", "X-Frame-Options missing — clickjacking risk"],
  ["x-content-type-options", "low", "X-Content-Type-Options missing — MIME sniffing"],
  ["referrer-policy", "low", "Referrer-Policy missing"],
];

export async function checkHeaders(url) {
  const findings = [];
  let res;
  try {
    res = await fetch(url, { method: "GET", redirect: "follow" });
  } catch (e) {
    return { reachable: false, findings: [f("info", "Preview unreachable", String(e.message || e), url)] };
  }
  const present = new Set([...res.headers.keys()].map((k) => k.toLowerCase()));
  for (const [name, sev, detail] of EXPECTED_HEADERS) {
    if (!present.has(name)) findings.push(f(sev, `Header: ${name}`, detail, url));
  }
  if (res.headers.get("server")) {
    findings.push(f("low", "Server banner exposed", `Server: ${res.headers.get("server")}`, url));
  }
  return { reachable: true, status: res.status, findings };
}

export function summarize(findings) {
  const by = { high: 0, medium: 0, low: 0, info: 0 };
  for (const x of findings) by[x.severity] = (by[x.severity] || 0) + 1;
  return by;
}
