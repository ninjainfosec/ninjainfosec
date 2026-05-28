// REAL stage. Builds the site + email (Resend-style) record set and writes it
// to live DNS ONLY when ALLOW_DNS_WRITE=1 is set (never automatically).
import { createRecord, canWriteDns } from "../domains.js";

export async function run({ run, log }) {
  const domain = run.domain?.desired || "example.com";
  const records = [
    { type: "A", name: "@", value: "76.76.21.21" },
    { type: "CNAME", name: "www", value: "cname.vercel-dns.com" },
    { type: "TXT", name: "@", value: "v=spf1 include:_spf.resend.com ~all" },
    { type: "TXT", name: "resend._domainkey", value: "<DKIM public key from Resend>" },
    { type: "TXT", name: "_dmarc", value: "v=DMARC1; p=none;" },
  ];

  log.info(`${records.length} records prepared for ${domain} (site + email)`);
  for (const r of records) log.dim(`  ${r.type.padEnd(5)} ${r.name.padEnd(20)} ${r.value}`);

  const written = [];
  if (canWriteDns() && run.domain?.purchased) {
    log.warn(`ALLOW_DNS_WRITE=1 — writing ${records.length} records to ${domain}`);
    for (const r of records) {
      try {
        await createRecord(domain, r);
        written.push(r);
      } catch (e) {
        log.err(`  failed: ${r.type} ${r.name} — ${e.message}`);
      }
    }
    log.ok(`Wrote ${written.length}/${records.length} records`);
  } else {
    log.dim("  DRY-RUN: not writing. Needs owned domain + ALLOW_DNS_WRITE=1.");
  }

  const artifact = { domain, records, written: written.length };
  run.dns = artifact;
  return artifact;
}
