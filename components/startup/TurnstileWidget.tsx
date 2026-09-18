"use client";

import { useEffect, useRef, useCallback } from "react";

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
    onTurnstileLoad?: () => void;
  }
}

export default function TurnstileWidget({
  onToken,
  onExpire,
  className,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || !siteKey) return;

    // Clean up any existing widget first
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {}
      widgetIdRef.current = null;
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: onToken,
      "expired-callback": () => {
        onExpire?.();
      },
      theme: "light",
      size: "normal",
    });
  }, [siteKey, onToken, onExpire]);

  useEffect(() => {
    if (!siteKey) {
      console.warn("[TurnstileWidget] NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set.");
      // In dev without key, fire a dummy token so the form works
      if (process.env.NODE_ENV === "development") {
        onToken("dev-bypass-token");
      }
      return;
    }

    // If Turnstile script is already loaded, render immediately
    if (window.turnstile) {
      renderWidget();
      return;
    }

    // Otherwise inject the script once
    const existingScript = document.getElementById("cf-turnstile-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "cf-turnstile-script";
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    // Register the global onload callback
    window.onTurnstileLoad = renderWidget;

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  if (!siteKey && process.env.NODE_ENV === "development") {
    return (
      <div className={`text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 ${className ?? ""}`}>
        ⚠️ Turnstile CAPTCHA disabled (NEXT_PUBLIC_TURNSTILE_SITE_KEY not set)
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
}
