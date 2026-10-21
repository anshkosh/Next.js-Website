"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface PasswordFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export default function PasswordField({ label, id, className = "", ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input id={id} type={visible ? "text" : "password"} aria-label={label} className={`w-full ${className} pr-12`} {...props} />
      <button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white">
        {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  );
}
