import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ save: vi.fn(), remove: vi.fn(), refresh: vi.fn() }));
vi.mock("@/app/actions/profile.actions", () => ({ saveFounderMode: m.save }));
vi.mock("@/app/actions/startup.actions", () => ({ deleteStartup: m.remove }));
vi.mock("@/lib/auth-client", () => ({ authClient: { getSession: async () => ({}) } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: m.refresh }) }));
import DashboardModeControl from "../components/account/DashboardModeControl";
import DeleteStartupButton from "../components/dashboard/DeleteStartupButton";

let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.sessionStorage.clear();
  m.save.mockReset().mockResolvedValue({ success: true });
  m.remove.mockReset();
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });

it("offers an undo after switching founder mode, and undo does not offer another", async () => {
  await act(async () => root.render(<DashboardModeControl enabled />));
  await act(async () => host.querySelector<HTMLButtonElement>('[role="switch"]')!.click());
  expect(m.save).toHaveBeenLastCalledWith({ founderMode: false });
  expect(host.textContent).toContain("Founder mode is off");
  const undo = [...host.querySelectorAll("button")].find(button => button.textContent === "Undo")!;
  await act(async () => undo.click());
  expect(m.save).toHaveBeenLastCalledWith({ founderMode: true });
  expect([...host.querySelectorAll("button")].some(button => button.textContent === "Undo")).toBe(false);
});

it("keeps the undo offer when the dashboard re-renders the control", async () => {
  await act(async () => root.render(<DashboardModeControl enabled />));
  await act(async () => host.querySelector<HTMLButtonElement>('[role="switch"]')!.click());
  await act(async () => root.render(<div><DashboardModeControl key="member-view" enabled={false} /></div>));
  expect([...host.querySelectorAll("button")].some(button => button.textContent === "Undo")).toBe(true);
});

it("shows a failed delete inside the dialog instead of an alert", async () => {
  const alert = vi.fn(); vi.stubGlobal("alert", alert);
  m.remove.mockResolvedValue({ error: "Startup not found" });
  await act(async () => root.render(<DeleteStartupButton startupId="fixture" startupName="Test startup" />));
  await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="Delete Test startup"]')!.click());
  const confirm = [...document.querySelectorAll("button")].find(button => button.textContent === "Delete permanently")!;
  await act(async () => confirm.click());
  expect(m.remove).toHaveBeenCalledWith("fixture");
  expect(document.querySelector('[role="alert"]')?.textContent).toBe("Startup not found");
  expect(alert).not.toHaveBeenCalled();
});
