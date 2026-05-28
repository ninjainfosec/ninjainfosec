// Vercel domains + DNS client (zero-dep). Checks/plans are safe and automatic;
// PURCHASE and DNS WRITES are guarded behind explicit env opt-ins and never run
// from the normal pipeline flow.
const API = "https://api.vercel.com";

const team = () => (process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : "");
const auth = () => ({ Authorization: `Bearer ${process.env.VERCEL_TOKEN}` });
const hasToken = () => Boolean(process.env.VERCEL_TOKEN);

async function get(path) {
  const sep = path.includes("?") ? "&" : "?";
  const t = process.env.VERCEL_TEAM_ID ? `${sep}teamId=${process.env.VERCEL_TEAM_ID}` : "";
  const res = await fetch(`${API}${path}${t}`, { headers: auth() });
  const json = await res.json();
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${JSON.stringify(json)}`);
  return json;
}

export async function checkAvailability(name) {
  if (!hasToken()) return { dryRun: true, name, available: null };
  const j = await get(`/v4/domains/status?name=${encodeURIComponent(name)}`);
  return { dryRun: false, name, available: j.available };
}

export async function getPrice(name) {
  if (!hasToken()) return { dryRun: true, name, price: null, period: null };
  try {
    const j = await get(`/v4/domains/price?name=${encodeURIComponent(name)}`);
    return { dryRun: false, name, price: j.price, period: j.period };
  } catch {
    return { dryRun: false, name, price: null, period: null };
  }
}

// GUARDED. Requires VERCEL_TOKEN and ALLOW_DOMAIN_PURCHASE=1. Spends money.
export async function purchase(name, expectedPrice) {
  if (!hasToken()) throw new Error("no VERCEL_TOKEN");
  if (process.env.ALLOW_DOMAIN_PURCHASE !== "1") {
    throw new Error("refusing to buy: set ALLOW_DOMAIN_PURCHASE=1 to authorize spend");
  }
  const res = await fetch(`${API}/v5/domains/buy${team()}`, {
    method: "POST",
    headers: { ...auth(), "Content-Type": "application/json" },
    body: JSON.stringify({ name, expectedPrice }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`buy failed: ${res.status} ${JSON.stringify(json)}`);
  return json;
}

// GUARDED. Requires VERCEL_TOKEN and ALLOW_DNS_WRITE=1. Mutates live DNS.
export async function createRecord(domain, rec) {
  if (!hasToken()) throw new Error("no VERCEL_TOKEN");
  if (process.env.ALLOW_DNS_WRITE !== "1") {
    throw new Error("refusing to write DNS: set ALLOW_DNS_WRITE=1 to authorize");
  }
  const res = await fetch(`${API}/v2/domains/${domain}/records${team()}`, {
    method: "POST",
    headers: { ...auth(), "Content-Type": "application/json" },
    body: JSON.stringify({ type: rec.type, name: rec.name, value: rec.value, ttl: rec.ttl || 3600 }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`record ${rec.type} ${rec.name} failed: ${res.status} ${JSON.stringify(json)}`);
  return json;
}

export const canPurchase = () => hasToken() && process.env.ALLOW_DOMAIN_PURCHASE === "1";
export const canWriteDns = () => hasToken() && process.env.ALLOW_DNS_WRITE === "1";
