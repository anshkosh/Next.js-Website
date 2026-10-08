import { UPLOAD_SCAN_MODE } from "./scan-mode";
import { scanUpload } from "./safety";

/** Runs the ClamAV scan only when ClamAV is the configured control; otherwise the sanitising steps are the control. */
export async function scanIfEnabled(bytes: Buffer): Promise<void> {
  if (UPLOAD_SCAN_MODE === "clamav") await scanUpload(bytes);
}
