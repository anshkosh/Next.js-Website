// Exact public origins only: no wildcard subdomains or arbitrary request hosts.
// A callback lets Better Auth also retain its configured base URL (including local dev).
export function getTrustedAuthOrigins(): string[] {
  return ["https://www.anshkosh.com", "https://anshkosh.com"];
}
