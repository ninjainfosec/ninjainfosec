import { saveRun } from "./state.js";
import { log } from "./log.js";

// Run stages in order. With gate-every-stage, each stage executes, records its
// artifact, then halts at a GATE awaiting human approval before the next stage.
export async function advance(run, stages, { autoApprove = false } = {}) {
  while (run.currentStage < stages.length) {
    const i = run.currentStage;
    const def = stages[i];
    const state = run.stages[i];

    // If we're sitting at a gate already raised, do not re-run; wait for approve.
    if (state.status === "awaiting_approval" && !autoApprove) {
      raiseGate(run, def);
      return run;
    }

    if (state.status === "approved") {
      run.currentStage += 1;
      saveRun(run);
      continue;
    }

    if (state.status === "pending") {
      log.title(`Stage ${i + 1}/${stages.length}: ${def.name}`);
      log.dim(`  tool: ${def.tool}`);
      const ctx = { run, stage: def, log };
      try {
        const artifact = await def.run(ctx);
        state.artifact = artifact ?? null;
        log.ok(`${def.name} produced its output.`);
      } catch (err) {
        state.status = "pending";
        state.note = String(err?.message || err);
        saveRun(run);
        log.err(`${def.name} failed: ${state.note}`);
        return run;
      }

      const needsGate = def.gate && !autoApprove;
      state.status = needsGate ? "awaiting_approval" : "approved";
      saveRun(run);

      if (needsGate) {
        raiseGate(run, def);
        return run;
      }
      run.currentStage += 1;
      saveRun(run);
    }
  }

  log.ok(`\nPipeline complete for ${run.id}. 🎉`);
  return run;
}

function raiseGate(run, def) {
  log.gate(`${def.name} — review the output above.`);
  log.dim(`  approve:  npm run approve   (or node cli.js approve)`);
  log.dim(`  reject:   node cli.js reject "<reason>"`);
}

export function approveCurrent(run, stages, reason) {
  const i = run.currentStage;
  if (i >= stages.length) {
    log.warn("Nothing to approve — pipeline already complete.");
    return run;
  }
  const state = run.stages[i];
  if (state.status !== "awaiting_approval") {
    log.warn(`Stage "${state.name}" is not awaiting approval (status: ${state.status}).`);
    return run;
  }
  state.status = "approved";
  state.note = reason || "approved";
  run.currentStage += 1;
  saveRun(run);
  log.ok(`Approved: ${state.name}`);
  return run;
}

export function rejectCurrent(run, stages, reason) {
  const i = run.currentStage;
  const state = run.stages[i];
  if (!state || state.status !== "awaiting_approval") {
    log.warn("No stage awaiting approval to reject.");
    return run;
  }
  // Reject sends the stage back to pending so a re-run regenerates it.
  state.status = "pending";
  state.artifact = null;
  state.note = `rejected: ${reason || "no reason given"}`;
  saveRun(run);
  log.warn(`Rejected ${state.name}. Re-run to regenerate. Reason: ${reason || "(none)"}`);
  return run;
}
