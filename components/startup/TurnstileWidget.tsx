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

let turnstileLoadPromise: Promise<void> | null = null;

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (turnstileLoadPromise) return turnstileLoadPromise;

  turnstileLoadPromise = new Promise<void>((resolve, reject) => {
    const script = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;

    const handleLoad = () => {
      if (window.turnstile) {
        resolve();
      } else {
        reject(new Error("Cloudflare Turnstile loaded without its API."));
      }
    };
    const handleError = () => reject(new Error("Cloudflare Turnstile failed to load."));

    if (script) {
      script.addEventListener("load", handleLoad, { once: true });
      script.addEventListener("error", handleError, { once: true });

      // A script injected by another component may already have finished before
      // this listener was attached.
      if ((script as HTMLScriptElement & { readyState?: string }).readyState === "complete") {
        handleLoad();
      }
      return;
    }

    const newScript = document.createElement("script");
    newScript.id = TURNSTILE_SCRIPT_ID;
    newScript.src = TURNSTILE_SCRIPT_SRC;
    newScript.async = true;
    newScript.defer = true;
    newScript.addEventListener("load", handleLoad, { once: true });
    newScript.addEventListener("error", handleError, { once: true });
    document.head.appendChild(newScript);
  }).catch((error) => {
    // Allow a later mount to retry after a transient network failure.
    turnstileLoadPromise = null;
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
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => onTokenRef.current(token),
          "expired-callback": () => onExpireRef.current?.(),
          theme: "light",
          size: "normal",
        });
      } catch (error) {
        console.error("[TurnstileWidget] Failed to render widget:", error);
        setLoadError(true);
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      loadTurnstile().then(renderWidget).catch((error) => {
        if (!disposed) {
          console.error("[TurnstileWidget] Failed to load widget:", error);
          setLoadError(true);
        }
      });
    }

    return () => {
      disposed = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

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

  if (loadError) {
    return (
      <p className={`text-sm text-red-600 ${className ?? ""}`} role="alert">
        CAPTCHA could not load. Please refresh and try again.
      </p>
    );
  }

  return <div ref={containerRef} className={className} />;
}
