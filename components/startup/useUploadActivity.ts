"use client";
import { useEffect, useRef } from "react";

export function useUploadActivity(busy: boolean, onBusyChange?: (busy: boolean) => void) {
  const callback = useRef(onBusyChange);
  useEffect(() => { callback.current = onBusyChange; }, [onBusyChange]);
  useEffect(() => { callback.current?.(busy); }, [busy]);
  useEffect(() => () => { callback.current?.(false); }, []);
}
