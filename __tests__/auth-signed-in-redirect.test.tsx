// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ session: null as unknown, redirect: vi.fn((path: string) => { throw new Error(`redirect:${path}`); }) }));
vi.mock("@/lib/viewer-session", () => ({ viewerSession: async () => state.session }));
vi.mock("next/navigation", () => ({ redirect: state.redirect }));
import LoginLayout from "@/app/(auth)/login/layout";
import RegisterLayout from "@/app/(auth)/register/layout";

beforeEach(() => { state.session = null; state.redirect.mockClear(); });

it.each([["login", LoginLayout], ["register", RegisterLayout]])("sends signed-in visitors from %s to the dashboard", async (_name, Layout) => {
  expect(await Layout({ children: "form" })).toBe("form");
  state.session = { user: { id: "member" } };
  await expect(Layout({ children: "form" })).rejects.toThrow("redirect:/dashboard");
});
