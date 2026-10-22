# Content Security Policy

HTML requests pass through root-level `proxy.ts`, which Next.js discovers beside
`app/`. A cryptographically random 16-byte nonce is generated per request. Incoming
nonce/policy headers are overwritten; matching policy headers reach both the
server renderer and response. HTML is private/no-store, and the root layout reads
request headers so a build-time nonce is not reused as a shared static shell.

Production script execution requires a nonce or a trusted dynamic script chain.
It allows neither unsafe-inline nor unsafe-eval for scripts. Development alone
permits eval and loopback WebSocket connections for Next's tooling. The early
curtain script is nonced; Next nonces its framework scripts. The Turnstile loader
copies the document's nonce, following [Cloudflare's CSP guidance](https://developers.cloudflare.com/turnstile/reference/content-security-policy/).
Non-executable JSON-LD remains data rather than executable script.

Frames are limited to the existing CAPTCHA, YouTube and Vimeo providers. Objects
and base tags are blocked, forms stay same-origin, and framing is same-origin to
match the existing frame header. Images permit HTTPS, data and blob URLs because
the product supports external profile/journal images and image editing. Styles
retain unsafe-inline for React animations, cropping and Quill; this exception
does not allow inline JavaScript. Review tighter style handling separately.

API responses and assets bypass this proxy. Existing download routes retain their
own PDF sandbox, no-store and access checks. CSP does not replace file-content
validation, authentication, ownership checks or HTML sanitization.

The former `app/proxy.ts` was outside Next's documented discovery location and
exported the old middleware function. Its removal does not replace authorization:
layouts and every protected mutation remain the authorization boundary.

Local verification covers nonce freshness, spoofed-header replacement, production
directives, matching SSR script nonces, static-asset exclusion, Turnstile nonce
propagation and interactive search/cookie controls under a production build.
The existing isolated browser suite exercises sign-in, profile saving, password
changes and uploads under the policy; run it with PostgreSQL/Redis and qpdf.

Framework guidance: installed
`node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md` and
`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`.
