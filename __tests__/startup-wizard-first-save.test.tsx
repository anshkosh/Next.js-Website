import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { wizardFields } from "@/lib/startup-wizard";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  submit: vi.fn(),
  push: vi.fn(),
  markSaved: vi.fn(),
}));
vi.mock("@/components/useHydrated", () => ({ useHydrated: () => true }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/app/actions/startup.actions", () => ({ createStartup: mocks.create, updateStartup: mocks.update, submitForReview: mocks.submit }));
vi.mock("@/components/startup/useDraftRecovery", () => ({ useDraftRecovery: () => ({ dirty: false, markSaved: mocks.markSaved }) }));
vi.mock("@/components/startup/DraftRecoveryNotice", () => ({ default: () => null }));
vi.mock("@/components/startup/EditableImageUpload", () => ({ default: () => null }));
vi.mock("@/components/startup/GalleryImageEditor", () => ({ default: () => null }));
vi.mock("@/components/startup/PitchDeckUpload", () => ({ default: () => null }));
vi.mock("@/components/startup/FounderManager", () => ({ default: () => null }));
vi.mock("@/components/startup/IconSelect", () => ({ default: () => null }));
vi.mock("@/components/startup/StartupReview", () => ({ default: () => null }));

import StartupWizard from "@/app/(founder)/startup/new/StartupWizard";

let host: HTMLDivElement;
let root: Root;
const startupId = "cm12345678901234567890123";
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("fetch", vi.fn(async () => ({ json: async () => [{ id: startupId, name: "Example category", iconName: null }] })));
  mocks.create.mockReset().mockResolvedValue({ data: { id: startupId } });
  mocks.update.mockReset().mockResolvedValue({ data: { id: startupId } });
  mocks.markSaved.mockReset();
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); });

async function setValue(selector: string, value: string) {
  const control = host.querySelector<HTMLInputElement | HTMLSelectElement>(selector)!;
  await act(async () => {
    const prototype = control instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(control, value);
    control.dispatchEvent(new Event(control instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
  });
}

it("creates a first-step server draft, saves it again, then continues with the same draft", async () => {
  await act(async () => root.render(<StartupWizard userId="founder" initialId={null} initialStep={1} initialData={wizardFields(null)} />));
  expect(host.querySelector('label[for="name"]')?.textContent).toContain("Startup Name");
  expect(host.querySelector('input[name="name"]')?.getAttribute("aria-describedby")).toBe("startup-help-name");
  expect(host.textContent).toContain("Save your draft to your account after entering the name, tagline, and category");
  await setValue('[name="name"]', "Example startup");
  await setValue('[name="tagline"]', "A helpful product for teams");
  await setValue('[name="categoryId"]', startupId);

  await act(async () => [...host.querySelectorAll("button")].find(button => button.textContent === "Save Draft")!.click());
  expect(mocks.create).toHaveBeenCalledTimes(1);
  expect(mocks.update).not.toHaveBeenCalled();
  expect(host.textContent).toContain("Step 1: Basic Info");

  await act(async () => [...host.querySelectorAll("button")].find(button => button.textContent === "Save Draft")!.click());
  expect(mocks.update).toHaveBeenCalledTimes(1);
  const repeatedSave = mocks.update.mock.calls[0]![0] as FormData;
  expect(repeatedSave.get("id")).toBe(startupId);
  expect(repeatedSave.get("name")).toBe("Example startup");
  expect(host.textContent).toContain("Step 1: Basic Info");

  await act(async () => [...host.querySelectorAll("button")].find(button => button.textContent === "Next")!.click());
  expect(mocks.update).toHaveBeenCalledTimes(2);
  expect(host.textContent).toContain("Step 2: Details");
  expect(host.querySelector('textarea[name="description"]')).not.toBeNull();
});
