"use client";

import { ReactNode } from "react";

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

type StudyPanelProps = {
  theme: "light" | "dark";
  onClose?: () => void;
  title?: string;
  children: ReactNode;
};

export function StudyPanel({ theme, onClose, title = "Study Tools", children }: StudyPanelProps) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden overscroll-contain",
        theme === "dark" ? "bg-slate-950" : "bg-white"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between border-b px-4 py-3",
          theme === "dark" ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-white"
        )}
      >
        <h2 className={cn("text-sm font-semibold", theme === "dark" ? "text-slate-100" : "text-slate-900")}>{title}</h2>
        {onClose && (
          <button
            onClick={onClose}
            className={cn(
              "rounded-lg px-2 py-1 text-xs font-medium",
              theme === "dark"
                ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            )}
            aria-label="Close study panel"
          >
            Close
          </button>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
