import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  session: vi.fn(),
  profile: vi.fn(),
  find: vi.fn(),
  count: vi.fn(),
  setting: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: state.session } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));
vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: state.profile },
    startup: { findFirst: state.find, count: state.count },
  },
}));
vi.mock("@/app/actions/settings.actions", () => ({
  getSettingValue: state.setting,
}));
vi.mock("../app/(founder)/startup/new/StartupWizard", () => ({
  default: "wizard-fixture",
}));
import NewStartupPage from "../app/(founder)/startup/new/page";

beforeEach(() => {
  vi.resetAllMocks();
  state.session.mockResolvedValue({ user: { id: "owner" } });
  state.profile.mockResolvedValue({ founderMode: true });
  state.count.mockResolvedValue(1);
  state.setting.mockResolvedValue("1");
});
it("rehydrates the existing owned draft without redirecting a just-saved wizard back to step one", async () => {
  state.find.mockResolvedValue({
    id: "draft",
    name: "Saved startup",
    galleryImages: [],
    metadata: {
      features: [
        {
          icon: "Zap",
          title: "Saved feature",
          description: "Saved description",
        },
      ],
    },
  });
  const page = await NewStartupPage({ searchParams: Promise.resolve({}) });
  expect(page.props).toMatchObject({
    initialId: "draft",
    initialData: {
      name: "Saved startup",
      features: [{ title: "Saved feature" }],
    },
  });
  expect(state.find).toHaveBeenCalledWith(
    expect.objectContaining({ where: { founderId: "owner", status: "DRAFT" } }),
  );
});
it("keeps the step and refuses foreign or missing drafts", async () => {
  state.find.mockResolvedValueOnce({
    id: "draft",
    name: "Saved",
    galleryImages: [],
    metadata: {},
  });
  const page = await NewStartupPage({
    searchParams: Promise.resolve({ draft: "draft", step: "4" }),
  });
  expect(page.props).toMatchObject({ initialId: "draft", initialStep: 4 });
  expect(state.find).toHaveBeenCalledWith({
    where: { id: "draft", founderId: "owner", status: "DRAFT" },
  });
  state.find.mockResolvedValue(null);
  await expect(
    NewStartupPage({ searchParams: Promise.resolve({ draft: "foreign" }) }),
  ).rejects.toThrow("redirect:/dashboard");
});
it("explains an exhausted allowance before showing a new submission form", async () => {
  state.find.mockResolvedValue(null);
  const page = await NewStartupPage({ searchParams: Promise.resolve({}) });
  expect(renderToStaticMarkup(page)).toContain(
    "Your startup allowance is in use",
  );
  expect(renderToStaticMarkup(page)).not.toContain("wizard-fixture");
});
