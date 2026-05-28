// STUB. Real run sets DNS via Vercel domains / DNS provider API.
// Resend-style email needs SPF + DKIM + DMARC in addition to site records.
export async function run({ run, log }) {
  log.warn("dns: STUB — returns the record set; real run writes them via the DNS API.");
  const domain = run.domain?.desired || "example.com";
  const records = [
    { type: "A", name: "@", value: "76.76.21.21" }, // Vercel anycast example
    { type: "CNAME", name: "www", value: "cname.vercel-dns.com" },
    { type: "TXT", name: "@", value: "v=spf1 include:_spf.resend.com ~all" },
    { type: "TXT", name: "resend._domainkey", value: "<DKIM public key>" },
    { type: "TXT", name: "_dmarc", value: "v=DMARC1; p=none;" },
  ];
  run.dns = { domain, records };
  log.info(`${records.length} records prepared for ${domain} (site + email)`);
  return run.dns;
}
