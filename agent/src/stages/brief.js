// Turns the raw idea string into a structured brief other stages consume.
export async function run({ run, log }) {
  const raw = (run.brief || "").trim();
  const slug =
    raw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "site";

  const brief = {
    raw,
    slug,
    title: raw ? titleCase(raw) : "Untitled Site",
    pages: ["home", "about", "contact"],
    audience: "TBD — refine before approving",
    brandTone: "TBD",
  };

  log.info(`slug: ${brief.slug}`);
  log.info(`title: ${brief.title}`);
  log.info(`pages: ${brief.pages.join(", ")}`);
  log.dim("  (edit runs/<id>.json or reject to regenerate before approving)");

  // Persist onto the run so downstream stages can read it.
  run.briefStructured = brief;
  return brief;
}

function titleCase(s) {
  return s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
}
