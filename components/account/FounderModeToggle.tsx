"use client";

import { useState } from "react";

export default function FounderModeToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const [interacted, setInteracted] = useState(false);
  return (
    <div className="flex items-center gap-3">
      <button
        id="founder-mode"
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby="founder-mode-label"
        aria-describedby="founder-mode-help"
        data-on={checked}
        onClick={() => {
          setInteracted(true);
          onChange(!checked);
        }}
        className={`t-toggle ${interacted ? "is-init" : ""} flex h-11 w-14 shrink-0 items-center rounded-full px-1.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral-700 disabled:opacity-60 ${checked ? "bg-coral-600" : "bg-gray-500"}`}
      >
        <span className="t-toggle-thumb block h-7 w-7 rounded-full bg-white shadow-sm" />
      </button>
      <label
        id="founder-mode-label"
        htmlFor="founder-mode"
        className="cursor-pointer font-semibold text-gray-900"
      >
        Founder mode{" "}
        <span className="ml-1 text-sm font-normal text-gray-600">
          {checked ? "On" : "Off"}
        </span>
      </label>
    </div>
  );
}
