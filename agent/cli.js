#!/usr/bin/env node
import { loadConfig, loadStages } from "./src/pipeline.js";
import { loadRun, saveRun, newRun, latestRunId } from "./src/state.js";
import { advance, approveCurrent, rejectCurrent } from "./src/orchestrator.js";
import { attachHero } from "./src/hero.js";
import { run as scaffoldStage } from "./src/stages/scaffold.js";
import { log } from "./src/log.js";

const argv = process.argv.slice(2);
const cmd = argv[0];
const flags = new Set(argv.slice(1).filter((a) => a.startsWith("-")));
const rest = argv.slice(1).filter((a) => !a.startsWith("-"));
const auto = cmd === "auto" || flags.has("--yes") || flags.has("-y");

const config = loadConfig();
const stages = await loadStages(config);

function currentRun() {
  const id = latestRunId();
  if (!id) {
    log.err("No run found. Start one: node cli.js run \"your site idea\"");
    process.exit(1);
  }
  return loadRun(id);
}

switch (cmd) {
  case "run":
  case "auto": {
    let run = loadRun(latestRunId() || "");
    const brief = rest.join(" ").trim();
    if (!run || brief) {
      if (!brief) {
        log.err('Provide a brief: node cli.js run "a portfolio site for a photographer"');
        process.exit(1);
      }
      run = saveRun(newRun(brief, stages, config.stack));
      log.ok(`Started ${run.id} (stack: ${config.stack})${auto ? " — unattended" : ""}`);
    } else {
      log.info(`Resuming ${run.id}`);
    }
    if (auto) log.dim("  auto mode: review gates auto-approved; money/go-live still need ALLOW_* env flags");
    await advance(run, stages, { autoApprove: auto });
    break;
  }
  case "approve": {
    let run = currentRun();
    run = approveCurrent(run, stages, rest.join(" "));
    await advance(run, stages); // roll forward to the next gate
    break;
  }
  case "reject": {
    const run = currentRun();
    rejectCurrent(run, stages, rest.join(" "));
    break;
  }
  case "attach-hero": {
    const source = rest.join(" ").trim();
    if (!source) {
      log.err('Provide an image path or URL: node cli.js attach-hero ./hero.png');
      process.exit(1);
    }
    const run = currentRun();
    const dest = await attachHero(run, source);
    log.ok(`hero saved -> ${dest.replace(process.cwd() + "/", "")}`);
    await scaffoldStage({ run, log }); // refresh files so the hero renders
    saveRun(run);
    log.ok("scaffold refreshed; hero now backgrounds the landing section.");
    break;
  }
  case "set-preview": {
    const url = rest.join(" ").trim();
    if (!url) {
      log.err("Provide a deployed URL: node cli.js set-preview https://my-site.vercel.app");
      process.exit(1);
    }
    const run = currentRun();
    run.preview = { dryRun: false, target: "preview", url, source: "mcp" };
    saveRun(run);
    log.ok(`preview URL recorded: ${url} (security stage will scan it)`);
    break;
  }
  case "status": {
    const run = currentRun();
    printStatus(run, stages);
    break;
  }
  default:
    log.title("website-factory agent");
    console.log(`
  node cli.js auto "<idea>"    ONE-CLICK: run all stages unattended
  node cli.js run "<idea>"     start a new pipeline run (gated)
  node cli.js run              resume the latest run
  node cli.js approve [note]   approve the current gate, continue
  node cli.js reject "<why>"   reject current stage (regenerates on next run)
  node cli.js attach-hero <p>  attach a hero image (local path or URL) to the project
  node cli.js set-preview <u>  record an externally-deployed (e.g. MCP) preview URL
  node cli.js status           show progress
`);
}

function printStatus(run, stages) {
  log.title(`${run.id} — ${run.brief}`);
  const mark = { pending: "·", awaiting_approval: "🚦", approved: "✓", rejected: "✗" };
  run.stages.forEach((s, i) => {
    const here = i === run.currentStage ? " <— here" : "";
    console.log(`  ${mark[s.status] || "?"} ${String(i + 1).padStart(2)}. ${s.name}${here}`);
  });
}
