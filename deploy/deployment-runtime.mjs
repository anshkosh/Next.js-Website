import net from "node:net";

export async function assertCandidateAvailable(processes, port, webName) {
  const conflict = processes.find(process => process.name === webName ||
    Number(process.pm2_env?.PORT ?? process.pm2_env?.env?.PORT) === port);
  if (conflict) throw new Error(`Candidate port ${port} or process ${webName} is already registered in PM2 (${conflict.name}). Review the stale process before deploying.`);
  // An exclusive bind also catches listeners outside PM2. Release immediately;
  // the candidate must use fork mode so any later collision fails at startup.
  await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", () => reject(new Error(`Candidate port ${port} is already occupied or unavailable. Current release retained.`)));
    probe.listen({ host: "127.0.0.1", port, exclusive: true }, () => probe.close(error => error ? reject(error) : resolve()));
  });
}
