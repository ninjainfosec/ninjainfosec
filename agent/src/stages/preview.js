// STUB. Real run: push to GitHub then deploy a Vercel preview.
//   mcp__github__push_files
//   mcp__vercel__deploy_to_vercel  (target: preview)
//   mcp__vercel__get_deployment_build_logs
export async function run({ run, log }) {
  log.warn("preview: STUB — real run pushes to GitHub and deploys a Vercel preview.");
  const artifact = {
    repo: run.briefStructured?.slug || "site",
    previewUrl: null, // filled by mcp__vercel__deploy_to_vercel
    todo: ["push_files", "deploy_to_vercel(preview)", "tail build logs"],
  };
  run.preview = artifact;
  return artifact;
}
