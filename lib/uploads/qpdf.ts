import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { UploadError } from "./safety";

export type QpdfRunner = (args: string[]) => Promise<void>;

const UNREADABLE = "This PDF could not be read. Export it again and try once more.";
const UNAVAILABLE = "PDF checking is temporarily unavailable. Please try again shortly.";

/** Runs the qpdf binary without a shell. Resolves on exit 0; rejects with the process exit code otherwise. */
export const runQpdf: QpdfRunner = args => new Promise((resolve, reject) => {
  execFile("qpdf", args, { timeout: 20_000, windowsHide: true, maxBuffer: 1024 * 1024 }, error => {
    if (!error) return resolve();
    const code = (error as NodeJS.ErrnoException).code;
    reject(Object.assign(new Error(error.message), { code }));
  });
});

/**
 * Second, independent PDF parser. `qpdf --check` must report no errors or warnings, then the file is rewritten by qpdf
 * so only structurally valid, referenced objects survive. A missing binary fails closed (retryable 503), never skips.
 */
export async function qpdfNormalize(bytes: Buffer, run: QpdfRunner = runQpdf): Promise<Buffer> {
  const dir = await mkdtemp(path.join(tmpdir(), `anshkosh-qpdf-${randomBytes(4).toString("hex")}-`));
  const input = path.join(dir, "in.pdf");
  const output = path.join(dir, "out.pdf");
  try {
    await writeFile(input, bytes, { mode: 0o600 });
    try {
      await run(["--check", input]);
      await run([input, output]);
    } catch (error) {
      const code = (error as { code?: string | number }).code;
      if (code === "ENOENT" || code === "EACCES") throw new UploadError(UNAVAILABLE);
      throw new UploadError(UNREADABLE, 400); // qpdf exit 2 (errors) or 3 (warnings): do not store a damaged or odd PDF.
    }
    return await readFile(output);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
