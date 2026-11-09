"use client";

import { useMemo } from "react";
import qrcode from "qrcode-generator";

/** Renders an otpauth:// URI as an inline SVG QR code. Nothing leaves the browser. */
export default function TotpQrCode({ uri, size = 192 }: { uri: string; size?: number }) {
  const { count, path } = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(uri);
    qr.make();
    const modules = qr.getModuleCount();
    let d = "";
    for (let row = 0; row < modules; row++) {
      for (let col = 0; col < modules; col++) {
        if (qr.isDark(row, col)) d += `M${col + 4} ${row + 4}h1v1h-1z`;
      }
    }
    return { count: modules + 8, path: d };
  }, [uri]);

  return (
    <svg
      role="img"
      aria-label="QR code for your authenticator app"
      width={size}
      height={size}
      viewBox={`0 0 ${count} ${count}`}
      shapeRendering="crispEdges"
      className="rounded-lg bg-white"
    >
      <rect width={count} height={count} fill="#ffffff" />
      <path d={path} fill="#111827" />
    </svg>
  );
}
