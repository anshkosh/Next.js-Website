// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  programFindFirst: vi.fn(),
  programUpsert: vi.fn(),
  requestFindUnique: vi.fn(),
  requestCreate: vi.fn(),
  requestFindFirst: vi.fn(),
  requestUpdateMany: vi.fn(),
  requestDelete: vi.fn(),
  startupFindFirst: vi.fn(),
  revalidatePath: vi.fn(),
  checkRateLimit: vi.fn(),
  verifyTurnstileToken: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: mocks.getSession } } }));
vi.mock("@/lib/db", () => ({ db: {
  betaTesterProgram: { findFirst: mocks.programFindFirst, upsert: mocks.programUpsert },
  betaTesterRequest: { findUnique: mocks.requestFindUnique, create: mocks.requestCreate, findFirst: mocks.requestFindFirst, updateMany: mocks.requestUpdateMany, delete: mocks.requestDelete },
  startup: { findFirst: mocks.startupFindFirst },
} }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers({ "user-agent": "test" })) }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/utils/rate-limit", () => ({ checkRateLimit: mocks.checkRateLimit }));
vi.mock("@/lib/utils/turnstile", () => ({ verifyTurnstileToken: mocks.verifyTurnstileToken }));
vi.mock("@/lib/utils/fingerprint", () => ({ generateFingerprint: () => "test-fingerprint" }));

import { clearOldBetaRequests, deleteBetaTesterRequest, reviewBetaTesterRequest, saveBetaTesterProgram, submitBetaTesterRequest } from "@/app/actions/beta-tester.actions";
import { BETA_TESTER_CONSENT_VERSION } from "@/lib/validators/beta-tester.schema";

describe("beta tester signup and founder review", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-18T10:00:00.000Z"));
    mocks.getSession.mockResolvedValue({ user: { id: "founder-1", emailVerified: true, banned: false } });
    mocks.programFindFirst.mockResolvedValue({ id: "program-1", startup: { slug: "sample" } });
    mocks.requestFindUnique.mockResolvedValue(null);
    mocks.requestCreate.mockResolvedValue({});
    mocks.requestUpdateMany.mockResolvedValue({ count: 1 });
    mocks.checkRateLimit.mockResolvedValue(true);
    mocks.verifyTurnstileToken.mockResolvedValue(true);
    mocks.startupFindFirst.mockResolvedValue({ id: "startup-1", slug: "sample", status: "LIVE" });
  });

  afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });

  const validApplication = {
    startupId: "startup-1", name: "Riya", email: " Riya@Example.com ", message: "I would like to test checkout.",
    consent: true, adultConfirmed: true, turnstileToken: "captcha-token",
  };

  it("requires a distinct affirmative consent and adult confirmation", async () => {
    const result = await submitBetaTesterRequest({ ...validApplication, consent: false, adultConfirmed: false });
    expect(result.error).toMatch(/consent/i);
    expect(mocks.verifyTurnstileToken).not.toHaveBeenCalled();
    expect(mocks.requestCreate).not.toHaveBeenCalled();
  });

  it("stores normalized contact data and a timestamped consent version without returning the email", async () => {
    const result = await submitBetaTesterRequest(validApplication);
    expect(result).toEqual({ success: true });
    expect(mocks.programFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { startupId: "startup-1", enabled: true, startup: { status: "LIVE", founder: { founderMode: true } } } }));
    expect(mocks.requestCreate).toHaveBeenCalledWith({ data: {
      programId: "program-1", name: "Riya", email: "riya@example.com", message: "I would like to test checkout.",
      consentedAt: new Date("2026-10-18T10:00:00.000Z"), consentVersion: BETA_TESTER_CONSENT_VERSION,
    } });
    expect(result).not.toHaveProperty("email");
  });

  it("does not store applications after signups close", async () => {
    mocks.programFindFirst.mockResolvedValue(null);
    const result = await submitBetaTesterRequest(validApplication);
    expect(result.error).toMatch(/closed/i);
    expect(mocks.requestCreate).not.toHaveBeenCalled();
  });

  it("only lets an owning founder review and reveals email after approval at the page boundary", async () => {
    mocks.requestFindFirst.mockResolvedValue({ id: "request-1", status: "PENDING", program: { startup: { id: "startup-1", slug: "sample" } } });
    const result = await reviewBetaTesterRequest("request-1", "APPROVED");
    expect(result).toEqual({ success: true });
    expect(mocks.requestFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "request-1", program: { startup: { founderId: "founder-1" } } } }));
    expect(mocks.requestUpdateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "request-1", status: "PENDING", createdAt: { gte: new Date("2026-07-20T10:00:00.000Z") }, program: { startup: { founderId: "founder-1" } } }, data: { status: "APPROVED", reviewedAt: new Date("2026-10-18T10:00:00.000Z") } }));
  });

  it("erases applicant contact details when the founder declines", async () => {
    mocks.requestFindFirst.mockResolvedValue({ id: "request-1", status: "PENDING", program: { startup: { id: "startup-1", slug: "sample" } } });
    await reviewBetaTesterRequest("request-1", "DECLINED");
    expect(mocks.requestUpdateMany).toHaveBeenCalledWith(expect.objectContaining({ data: {
      status: "DECLINED", reviewedAt: new Date("2026-10-18T10:00:00.000Z"), name: null, email: null, message: null,
    } }));
  });

  it("prevents non-owners from changing a beta program", async () => {
    mocks.startupFindFirst.mockResolvedValue(null);
    const result = await saveBetaTesterProgram("not-owned", { enabled: false, description: "", reward: "" });
    expect(result.error).toMatch(/not found/i);
    expect(mocks.programUpsert).not.toHaveBeenCalled();
  });

  it("scopes the bulk retention control to the verified owner's old pending requests", async () => {
    expect(await clearOldBetaRequests("startup-1")).toEqual({ success: true, removed: 1 });
    expect(mocks.requestUpdateMany).toHaveBeenCalledWith({ where: { program: { startupId: "startup-1", startup: { founderId: "founder-1" } }, status: "PENDING", createdAt: { lt: new Date("2026-09-18T10:00:00.000Z") } }, data: { name: null, email: null, message: null, status: "DECLINED", reviewedAt: new Date("2026-10-18T10:00:00.000Z") } });
  });

  it("allows an owner to erase an approved request from the dashboard", async () => {
    mocks.requestFindFirst.mockResolvedValue({ id: "request-1", program: { startup: { id: "startup-1" } } });
    expect(await deleteBetaTesterRequest("request-1")).toEqual({ success: true });
    expect(mocks.requestDelete).toHaveBeenCalledWith({ where: { id: "request-1" } });
  });
});
