import { expect, it, vi } from "vitest";
import { previewMotionRequested, requestPreviewMotion, subscribeToPreviewMotion } from "../lib/preview-motion";

it("enables preview motion only on request and notifies subscribers once", () => {
  expect(previewMotionRequested()).toBe(false);
  const listener = vi.fn();
  const unsubscribe = subscribeToPreviewMotion(listener);
  requestPreviewMotion();
  expect(previewMotionRequested()).toBe(true);
  expect(listener).toHaveBeenCalledTimes(1);
  requestPreviewMotion();
  expect(listener).toHaveBeenCalledTimes(1);
  unsubscribe();
});
