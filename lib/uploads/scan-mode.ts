// How uploads are checked before storage.
//   "clamav"        : every file is also scanned by ClamD on 127.0.0.1:3310 (see deploy/LAUNCH-SAFEGUARDS.md). Fails closed.
//   "sanitize-only" : no antivirus. Images are decoded and re-encoded by sharp; PDFs are rejected if they carry scripts,
//                     attachments or launch actions, rewritten by pdf-lib, then validated and rewritten by qpdf.
// This is the interim mode while the VPS lacks the RAM for ClamAV. Install ClamAV, run deploy/check-scanner.mjs, then
// change the value below to "clamav". deploy/operations.mjs reads this exact line, so keep its shape.
export const UPLOAD_SCAN_MODE = "sanitize-only" as "clamav" | "sanitize-only";
