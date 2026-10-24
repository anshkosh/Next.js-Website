// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ session: null as unknown, path: "/login", redirect: vi.fn((path: string) => { throw new Error(`redirect:${path}`); }) }));
vi.mock("@/lib/viewer-session", () => ({ viewerSession: async () => state.session }));
vi.mock("next/navigation", () => ({ redirect: state.redirect }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-anshkosh-path": state.path }) }));
import LoginLayout from "@/app/(auth)/login/layout";
import RegisterLayout from "@/app/(auth)/register/layout";

beforeEach(() => { state.session = null; state.path = "/login"; state.redirect.mockClear(); });

it.each([["login", LoginLayout], ["register", RegisterLayout]])("sends signed-in visitors from %s to the dashboard", async (_name, Layout) => {
  expect(await Layout({ children: "form" })).toBe("form");
  state.session = { user: { id: "member" } };
  await expect(Layout({ children: "form" })).rejects.toThrow("redirect:/dashboard");
});

it("keeps a safe destination when an already signed-in visitor opens the auth forms", async () => {
  state.session = { user: { id: "member" } };
  state.path = "/login?next=%2Fstartup%2Fnew";
  await expect(LoginLayout({ children: "form" })).rejects.toThrow("redirect:/startup/new");
  state.path = "/register?next=https%3A%2F%2Fevil.example";
  await expect(RegisterLayout({ children: "form" })).rejects.toThrow("redirect:/dashboard");
});
