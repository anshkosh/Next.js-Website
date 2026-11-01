"use client";

import { useEffect, useRef, useState } from "react";

interface TurnstileWidgetProps {
  onToken: (token: string) => void;
  onExpire?: () => void;
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: Record<string, unknown>
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const TURNSTILE_SCRIPT_ID = "cf-turnstile-script";
const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const SECURITY_CHECK_WAIT_MS = 15_000;

let turnstileLoadPromise: Promise<void> | null = null;

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (turnstileLoadPromise) return turnstileLoadPromise;

  turnstileLoadPromise = new Promise<void>((resolve, reject) => {
    const script = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
    const target = script ?? document.createElement("script");
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      target.removeEventListener("load", handleLoad);
      target.removeEventListener("error", handleError);
      if (error) reject(error);
      else resolve();
    };
    const handleLoad = () => finish(window.turnstile
      ? undefined
      : new Error("Cloudflare Turnstile loaded without its API."));
    const handleError = () => finish(new Error("Cloudflare Turnstile failed to load."));
    // A stalled request (or an existing script whose load event was missed)
    // must not leave every form waiting on the shared promise forever.
    const timeout = setTimeout(() => finish(window.turnstile
      ? undefined
      : new Error("Cloudflare Turnstile loading timed out.")), SECURITY_CHECK_WAIT_MS);
    target.addEventListener("load", handleLoad, { once: true });
    target.addEventListener("error", handleError, { once: true });

    if (!script) {
      target.id = TURNSTILE_SCRIPT_ID;
      target.src = TURNSTILE_SCRIPT_SRC;
      const nonce = document.querySelector<HTMLScriptElement>("script[nonce]")?.nonce;
      if (nonce) target.nonce = nonce;
      target.async = true;
      target.defer = true;
      document.head.appendChild(target);
    }
  }).then(() => {
    turnstileLoadPromise = null;
  }).catch((error) => {
    // Allow a later mount to retry after a transient network failure.
    turnstileLoadPromise = null;
    if (!window.turnstile) document.getElementById(TURNSTILE_SCRIPT_ID)?.remove();
    throw error;
  });

  return turnstileLoadPromise;
}

export default function TurnstileWidget({
  onToken,
  onExpire,
  className,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const onExpireRef = useRef(onExpire);
  const [loadError, setLoadError] = useState(false);
  const [status, setStatus] = useState<"loading" | "verifying" | "interactive" | "verified">("loading");
  const [showRetry, setShowRetry] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    onTokenRef.current = onToken;
    onExpireRef.current = onExpire;
  }, [onToken, onExpire]);

  useEffect(() => {
    if (!siteKey) {
      console.error("[TurnstileWidget] NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set.");
      return;
    }

    let disposed = false;
    let hasVerifiedToken = false;
    let waitTimer: ReturnType<typeof setTimeout> | undefined;
    const watchForProgress = () => {
      clearTimeout(waitTimer);
      waitTimer = setTimeout(() => {
        if (!disposed) setShowRetry(true);
      }, SECURITY_CHECK_WAIT_MS);
    };
    const fail = () => {
      if (disposed) return;
      clearTimeout(waitTimer);
      hasVerifiedToken = false;
      onExpireRef.current?.();
      setStatus("verifying");
      setLoadError(true);
      setShowRetry(true);
    };
    watchForProgress();

    const renderWidget = () => {
      if (disposed || !containerRef.current || !window.turnstile) return;

      // Clean up any existing widget first.
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
      }

      try {
        setStatus("verifying");
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            if (disposed) return;
            hasVerifiedToken = true;
            clearTimeout(waitTimer);
            setLoadError(false);
            setShowRetry(false);
            setStatus("verified");
            onTokenRef.current(token);
          },
          "expired-callback": () => {
            if (disposed) return;
            hasVerifiedToken = false;
            onExpireRef.current?.();
            setStatus("verifying");
            watchForProgress();
            if (widgetIdRef.current) window.turnstile?.reset(widgetIdRef.current);
          },
          "before-interactive-callback": () => {
            if (disposed || hasVerifiedToken) return;
            clearTimeout(waitTimer);
            setStatus("interactive");
            setShowRetry(false);
          },
          "after-interactive-callback": () => {
            if (disposed || hasVerifiedToken) return;
            setStatus("verifying");
            watchForProgress();
          },
          "timeout-callback": fail,
          "unsupported-callback": fail,
          "error-callback": fail,
          theme: "light",
          size: "flexible",
        });
      } catch (error) {
        console.error("[TurnstileWidget] Failed to render widget:", error);
        fail();
      }
    };

    loadTurnstile().then(renderWidget).catch((error) => {
      if (!disposed) {
        console.error("[TurnstileWidget] Failed to load widget:", error);
        fail();
      }
    });

    return () => {
      disposed = true;
      clearTimeout(waitTimer);
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, attempt]);

  if (!siteKey) {
    if (process.env.NODE_ENV === "development") {
      return (
        <div className={`text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 ${className ?? ""}`}>
          ⚠️ Turnstile CAPTCHA is unavailable because NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set.
        </div>
      );
    }

    return (
      <p className={`text-sm text-red-600 ${className ?? ""}`} role="alert">
        CAPTCHA is temporarily unavailable. Please refresh and try again.
      </p>
    );
  }

  return <div className={className}>
    <p role="status" className="mb-2 text-sm text-gray-600">
      {status === "verified" ? "Security check complete." : status === "loading"
        ? "Loading security check…" : "Complete the security check below to continue."}
    </p>
    {/* Keep the host mounted through errors so retries and late success callbacks
        belong to a live widget instead of a detached element. */}
    <div ref={containerRef} className="min-h-[65px]" />
    {(loadError || showRetry) && <div className="mt-2 text-sm text-red-600" role={loadError ? "alert" : "status"}>
      <p>{loadError ? "CAPTCHA could not complete. Check your connection or browser settings, then try again."
        : "The security check is taking longer than expected. You can retry without losing your form."}</p>
      <button type="button" className="mt-1 min-h-11 font-semibold underline" onClick={() => {
        onExpireRef.current?.();
        setLoadError(false);
        setShowRetry(false);
        setStatus("loading");
        setAttempt(value => value + 1);
      }}>Retry CAPTCHA</button>
    </div>}
  </div>;
}
