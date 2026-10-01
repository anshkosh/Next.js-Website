import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import FAQContent from "../app/(public)/faq/FAQContent";
import FAQPage from "../app/(public)/faq/page";
import { faqData } from "../lib/faqs";

it("renders all answers without interaction and uses H2 question headings", () => {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(<FAQContent />);
  const panels = container.querySelectorAll('[data-slot="accordion-content"]');
  expect(panels).toHaveLength(faqData.length);
  expect(container.querySelectorAll("h2 button")).toHaveLength(faqData.length);
  faqData.forEach(({ answer }, index) => expect(panels[index].textContent).toBe(answer));
});

it("matches structured data to the full visible FAQ answer set", () => {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(<FAQPage />);
  const schema = JSON.parse(container.querySelector('script[type="application/ld+json"]')!.textContent!);
  expect(schema.mainEntity).toEqual(faqData.map(({ question, answer }) => ({
    "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer },
  })));
  expect(container.querySelectorAll("h1")).toHaveLength(1);
});

it("still expands and collapses answers while leaving content mounted", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<FAQContent />));
    const trigger = container.querySelector("button")!;
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    await act(async () => trigger.click());
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    await act(async () => trigger.click());
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(container.querySelectorAll('[data-slot="accordion-content"]')).toHaveLength(faqData.length);
  } finally {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  }
});
