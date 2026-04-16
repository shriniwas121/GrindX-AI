"use client";

import { BookOpen, Brain, Home, Target, Award, Library } from "lucide-react";
import { WorkspaceTabId } from "./types";

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

type MobileNavProps = {
  theme: "light" | "dark";
  active: WorkspaceTabId;
  onSelect: (tab: WorkspaceTabId) => void;
};

const mobileTabs: { id: WorkspaceTabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "chat", label: "Chat", icon: Home },
  { id: "summary", label: "Summary", icon: BookOpen },
  { id: "concepts", label: "Concepts", icon: Brain },
  { id: "practice", label: "Practice", icon: Target },
  { id: "mock", label: "Mock", icon: Award },
];

export function MobileNav({ theme, active, onSelect }: MobileNavProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 lg:hidden",
        theme === "dark" ? "border-slate-800 bg-slate-950/95" : "border-slate-200 bg-white/95"
      )}
    >
      <div className="grid grid-cols-7 gap-1">
        <button
          onClick={() => onSelect("library")}
          className={cn(
            "flex min-h-11 flex-col items-center justify-center rounded-xl text-[10px] font-medium",
            active === "library"
              ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white"
              : theme === "dark"
              ? "text-slate-200 hover:bg-slate-800"
              : "text-slate-700 hover:bg-slate-100"
          )}
        >
          <Library className="h-4 w-4" />
          Library
        </button>

        {mobileTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className={cn(
              "flex min-h-11 flex-col items-center justify-center rounded-xl text-[10px] font-medium",
              active === tab.id
                ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white"
                : theme === "dark"
                ? "text-slate-200 hover:bg-slate-800"
                : "text-slate-700 hover:bg-slate-100"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}

        <button
          onClick={() => onSelect("study")}
          className={cn(
            "flex min-h-11 flex-col items-center justify-center rounded-xl text-[10px] font-medium",
            active === "study"
              ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white"
              : theme === "dark"
              ? "text-slate-200 hover:bg-slate-800"
              : "text-slate-700 hover:bg-slate-100"
          )}
        >
          <BookOpen className="h-4 w-4" />
          Study
        </button>
      </div>
    </div>
  );
}
