---
description: Build a complete website end-to-end from a one-line brief — real design imagery, code, security scan, and a live preview deploy — using the website-factory agent plus the Canva / image-gen / Vercel MCP tools.
argument-hint: <site idea, e.g. "artisan bakery in Lisbon">
---

You are driving the **website-factory** pipeline in `agent/` to build a full site
from this brief:

> $ARGUMENTS

Run it as a HYBRID: the Node orchestrator does deterministic work + state, and
YOU perform the MCP-backed creative and deploy steps the headless process can't.
Work stage by stage; show the user what each stage produced.

1. **Brief + design.** Start the run, then approve the brief and design gates:
   - `node agent/cli.js run "$ARGUMENTS"`
   - `node agent/cli.js approve`  (accept brief)
   - Read `runs/<id>.json` to see the generated design system, then
     `node agent/cli.js approve` (accept design).

2. **Real hero image (MCP).** Read `design.heroImagePrompt` from the run JSON.
   - Call the image-gen MCP `generate_image` (model `nano_banana_pro`,
     `aspect_ratio: "16:9"`; preflight with `get_cost: true` and tell the user the
     credit cost before spending). Poll `job_display` until completed.
   - Attach it: `node agent/cli.js attach-hero <image-url>`. If outbound egress
     blocks the download, say so and keep the gradient hero (don't fail the run).

3. **Scaffold.** `node agent/cli.js approve` (accept scaffold). The generated
   Next.js app lives in `output/<slug>/`.

4. **Deploy (MCP).** Deploy `output/<slug>/` with the Vercel MCP
   (`deploy_to_vercel`). This needs no env token — the MCP is already authed.
   Record the URL so the security scan can use it:
   - `node agent/cli.js set-preview <preview-url>`
   - then `node agent/cli.js approve` (accept preview).

5. **Security.** `node agent/cli.js approve` runs the scan (static + live header
   checks against the deployed URL). Summarize findings.

6. **Domain + DNS.** Check the domain for real with the Vercel MCP
   (`check_domain_availability_and_price`), report price, then
   `node agent/cli.js approve` through the domain and DNS stages (these only PLAN;
   they never buy or write DNS).

7. **Go-live — STOP for the human.** Do NOT promote to production, buy a domain,
   or write DNS without explicit confirmation in chat. Ask first; only proceed if
   the user clearly says yes.

At the end, report: the preview URL, the design choices, the security summary,
the domain price, and exactly what still needs human approval to go live.
