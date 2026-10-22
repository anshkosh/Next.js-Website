import { expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import LoginPage from "../app/(auth)/login/page";
import RegisterPage from "../app/(auth)/register/page";
import AdminLoginPage from "../app/(auth)/admin/login/page";
import ResetPasswordPage from "../app/(auth)/reset-password/page";
import ForgotPasswordPage from "../app/(auth)/forgot-password/page";
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(), useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/lib/auth-client", () => ({ authClient: {} }));

it.each([["login", LoginPage], ["register", RegisterPage], ["admin login", AdminLoginPage], ["reset password", ResetPasswordPage], ["forgot password", ForgotPasswordPage]] as const)("keeps credentials out of URLs before hydration (%s)", (_, Page) => {
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(<Page />);
  const form = host.querySelector("form")!;
  expect(form).not.toBeNull();
  expect(form.method).toBe("post");
  expect(form.getAttribute("action")).toBeNull();
  const password = form.querySelector('input[type="password"]');
  if (password) {
    const paste = new Event("paste", { bubbles: true, cancelable: true });
    expect(password.dispatchEvent(paste)).toBe(true);
    expect(password.getAttribute("autocomplete")).toMatch(/password/);
  }
});
