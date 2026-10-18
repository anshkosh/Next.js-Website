import { expect, it } from "vitest";
import { escapeEmailHtml } from "@/lib/email/escape";
it("keeps account names and reset links from introducing email markup", () => {
  expect(escapeEmailHtml('<img src=x onerror="bad()"> & name')).toBe('&lt;img src=x onerror=&quot;bad()&quot;&gt; &amp; name');
  expect(escapeEmailHtml('https://example.test/reset?token=a&redirect=/dashboard')).toContain('&amp;redirect=');
});
