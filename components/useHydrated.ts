"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
// Controlled forms must not accept keystrokes before their handlers are attached.
export function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
