// STUB. MONEY GATE. Real run only CHECKS here; purchase needs explicit approval.
//   mcp__vercel__check_domain_availability_and_price
export async function run({ run, log }) {
  log.warn("domain: STUB — checks availability/price only. Purchase is a separate, approved action.");
  const desired = (run.briefStructured?.slug || "site") + ".com";
  const artifact = {
    desired,
    available: null, // filled by check_domain_availability_and_price
    priceUsd: null,
    purchased: false,
    note: "Never auto-purchase. Approval at this gate authorizes spend.",
  };
  run.domain = artifact;
  log.info(`would check availability for ${desired}`);
  return artifact;
}
