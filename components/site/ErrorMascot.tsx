"use client";

import AnshkoshMascot from "./AnshkoshMascot";

export default function ErrorMascot({ size = 160, label = "mascot Kosh" }: { size?: number; label?: string }) {
  return (
    <div className="mx-auto mb-4 flex justify-center">
      <AnshkoshMascot size={size} label={label} />
    </div>
  );
}
