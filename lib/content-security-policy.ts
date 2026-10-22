export function contentSecurityPolicy(nonce: string, development = false): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com${development ? " 'unsafe-eval'" : ""}`,
    // React animation styles, image cropping and Quill use inline styles.
    // Script execution remains protected by a fresh nonce, without unsafe-inline.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' https://challenges.cloudflare.com${development ? " ws://localhost:* ws://127.0.0.1:*" : ""}`,
    "frame-src https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
    "media-src 'self' blob: https:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    ...(!development ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}
