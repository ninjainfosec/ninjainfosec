#!/usr/bin/env node
import { loadConfig, loadStages } from "./src/pipeline.js";
import { loadRun, saveRun, newRun, latestRunId } from "./src/state.js";
import { advance, approveCurrent, rejectCurrent } from "./src/orchestrator.js";
import { log } from "./src/log.js";

const [cmd, ...rest] = process.argv.slice(2);

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
  case "run": {
    let run = loadRun(latestRunId() || "");
    const brief = rest.join(" ").trim();
    if (!run || brief) {
      if (!brief) {
        log.err('Provide a brief: node cli.js run "a portfolio site for a photographer"');
        process.exit(1);
      }
      run = saveRun(newRun(brief, stages, config.stack));
      log.ok(`Started ${run.id} (stack: ${config.stack})`);
    } else {
      log.info(`Resuming ${run.id}`);
    }
    await advance(run, stages);
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
  case "status": {
    const run = currentRun();
    printStatus(run, stages);
    break;
  }
  default:
    log.title("website-factory agent");
    console.log(`
  node cli.js run "<idea>"     start a new pipeline run
  node cli.js run              resume the latest run
  node cli.js approve [note]   approve the current gate, continue
  node cli.js reject "<why>"   reject current stage (regenerates on next run)
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
