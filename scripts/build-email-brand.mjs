// Export the outlined website logo/wordmark as a PNG for email clients.
// The SVG contains the real Oswald Bold glyphs; no recipient font is required.
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const source = fileURLToPath(new URL("../public/email-brand.svg", import.meta.url));
const output = fileURLToPath(new URL("../public/email-brand.png", import.meta.url));
await sharp(source, { density: 432 }).resize({ height: 192 }).png({ compressionLevel: 9 }).toFile(output);
console.log(`Exported email brand: ${output}`);
