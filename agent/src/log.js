const c = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
};

export const log = {
  info: (m) => console.log(`${c.cyan}›${c.reset} ${m}`),
  ok: (m) => console.log(`${c.green}✓${c.reset} ${m}`),
  warn: (m) => console.log(`${c.yellow}!${c.reset} ${m}`),
  err: (m) => console.log(`${c.red}✗${c.reset} ${m}`),
  gate: (m) => console.log(`\n${c.yellow}${c.bold}🚦 GATE${c.reset} ${m}`),
  title: (m) => console.log(`\n${c.bold}${m}${c.reset}`),
  dim: (m) => console.log(`${c.dim}${m}${c.reset}`),
};
