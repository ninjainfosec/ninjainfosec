// REAL stage. MONEY GATE. Checks availability + price for real; purchases ONLY
// when ALLOW_DOMAIN_PURCHASE=1 is set (never automatically).
import { checkAvailability, getPrice, purchase, canPurchase } from "../domains.js";

export async function run({ run, log }) {
  const desired = run.domainName || `${run.briefStructured?.slug || "site"}.com`;

  const avail = await checkAvailability(desired);
  const price = await getPrice(desired);

  if (avail.dryRun) {
    log.warn(`DRY-RUN: would check availability/price for ${desired} (set VERCEL_TOKEN).`);
  } else {
    log.info(`${desired}: ${avail.available ? "AVAILABLE" : "taken"}` + (price.price != null ? ` — $${price.price}/${price.period}yr` : ""));
  }

  let purchased = false;
  let purchaseResult = null;
  if (avail.available && canPurchase()) {
    log.warn(`ALLOW_DOMAIN_PURCHASE=1 set — buying ${desired} for $${price.price}`);
    purchaseResult = await purchase(desired, price.price);
    purchased = true;
    log.ok(`Purchased ${desired}`);
  } else if (avail.available) {
    log.dim("  not buying — approving this gate does NOT spend. Set ALLOW_DOMAIN_PURCHASE=1 to authorize.");
  }

  const artifact = { desired, available: avail.available, price: price.price, period: price.period, purchased, purchaseResult };
  run.domain = artifact;
  return artifact;
}
