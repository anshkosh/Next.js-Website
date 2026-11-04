// Export the outlined website logo/wordmark as a PNG for email clients.
// The SVG contains the real Oswald Bold glyphs; no recipient font is required.
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const source = fileURLToPath(new URL("../public/email-brand.svg", import.meta.url));
const output = fileURLToPath(new URL("../public/email-brand.png", import.meta.url));
const headerOutput = fileURLToPath(new URL("../public/email-header.png", import.meta.url));
const logo = await sharp(source, { density: 432 }).resize({ height: 192 }).png({ compressionLevel: 9 }).toBuffer();
await sharp(logo).png({ compressionLevel: 9 }).toFile(output);

const background = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="200" viewBox="0 0 1200 200"><rect width="1200" height="200" rx="24" fill="#fff"/><path d="M24 0h1152a24 24 0 0 1 24 24v8H0v-8A24 24 0 0 1 24 0Z" fill="#e8521e"/></svg>`);
const headerLogo = await sharp(logo).resize({ height: 96 }).png().toBuffer();
await sharp(background).composite([{ input: headerLogo, left: 48, top: 56 }]).png({ compressionLevel: 9 }).toFile(headerOutput);
console.log(`Exported email brand: ${output}`);
console.log(`Exported white email header: ${headerOutput}`);
