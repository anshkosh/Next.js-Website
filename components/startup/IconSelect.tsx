"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import CategoryIcon from "@/components/category/CategoryIcon";

interface IconSelectProps {
  value: string;
  onChange: (value: string) => void;
  availableIcons: string[];
}

export default function IconSelect({
  value,
  onChange,
  availableIcons,
}: IconSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentValue = value || "Zap";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between border border-gray-200 rounded-md p-2 bg-white text-sm focus:ring-coral-500 focus:border-coral-500 outline-none hover:border-gray-300 transition-colors"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-5 h-5 flex items-center justify-center text-coral-500 shrink-0">
            <CategoryIcon name={currentValue} className="w-4 h-4" />
          </div>
          <span className="truncate text-gray-700 font-medium">{currentValue}</span>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-1" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-52 max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl p-1.5 grid grid-cols-1 gap-0.5">
          {availableIcons.map((iconName) => (
            <button
              key={iconName}
              type="button"
              onClick={() => {
                onChange(iconName);
                setIsOpen(false);
              }}
              className={`flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md text-sm text-left transition-colors ${
                currentValue === iconName
                  ? "bg-coral-50 text-coral-600 font-medium"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <div
                className={`w-5 h-5 flex items-center justify-center shrink-0 ${
                  currentValue === iconName ? "text-coral-500" : "text-gray-500"
                }`}
              >
                <CategoryIcon name={iconName} className="w-4 h-4" />
              </div>
              <span className="truncate">{iconName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
