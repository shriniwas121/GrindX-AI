"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { MobileNav } from "@/components/workspace/MobileNav";
import type { WorkspaceTabId } from "@/components/workspace/types";

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

type WorkspaceLayoutProps = {
  theme: "light" | "dark";
  activeTab: WorkspaceTabId;
  showStudyToolsButton: boolean;
  showLibraryDrawer: boolean;
  onToggleLibraryDrawer: () => void;
  showStudyDrawer: boolean;
  onToggleStudyDrawer: () => void;
  onSelectTab: (tab: WorkspaceTabId) => void;
  sidebar: ReactNode;
  rightPanel: ReactNode;
  children: ReactNode;
};

export function WorkspaceLayout({
  theme,
  activeTab,
  showStudyToolsButton,
  showLibraryDrawer,
  onToggleLibraryDrawer,
  showStudyDrawer,
  onToggleStudyDrawer,
  onSelectTab,
  sidebar,
  rightPanel,
  children,
}: WorkspaceLayoutProps) {
  return (
    <>
      <div className="hidden h-[calc(100vh-4rem)] min-h-0 lg:block">{children}</div>

      <div className="h-[calc(100vh-4rem)] min-h-0 lg:hidden">
        <div className="h-full min-h-0">
          {children}
        </div>

        <MobileNav
          theme={theme}
          active={activeTab}
          onSelect={(next) => {
            if (next === "library") {
              if (showStudyDrawer) onToggleStudyDrawer();
              if (!showLibraryDrawer) onToggleLibraryDrawer();
              onSelectTab("library");
              return;
            }

            if (next === "study") {
              if (!showStudyToolsButton) return;
              if (showLibraryDrawer) onToggleLibraryDrawer();
              if (!showStudyDrawer) onToggleStudyDrawer();
              onSelectTab("study");
              return;
            }

            if (showLibraryDrawer) onToggleLibraryDrawer();
            if (showStudyDrawer) onToggleStudyDrawer();
            onSelectTab(next);
          }}
        />

        {showLibraryDrawer && (
          <div className="fixed inset-0 z-50">
            <button
              className="absolute inset-0 bg-black/40"
              aria-label="Close library drawer"
              onClick={onToggleLibraryDrawer}
            />
            <div
              className={cn(
                "absolute inset-y-0 left-0 w-[86vw] max-w-sm shadow-xl",
                theme === "dark" ? "bg-slate-950" : "bg-white"
              )}
            >
              <div className="flex h-14 items-center justify-between border-b px-4">
                <h3 className={cn("text-sm font-semibold", theme === "dark" ? "text-slate-100" : "text-slate-900")}>
                  Library
                </h3>
                <button
                  onClick={onToggleLibraryDrawer}
                  className="rounded-lg p-2"
                  aria-label="Close library drawer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="h-[calc(100%-3.5rem)] min-h-0">{sidebar}</div>
            </div>
          </div>
        )}

        {showStudyDrawer && (
          <div className="fixed inset-0 z-50">
            <button
              className="absolute inset-0 bg-black/40"
              aria-label="Close study drawer"
              onClick={onToggleStudyDrawer}
            />
            <div
              className={cn(
                "absolute inset-x-0 bottom-0 max-h-[86vh] rounded-t-2xl shadow-xl",
                theme === "dark" ? "bg-slate-950" : "bg-white"
              )}
            >
              <div className="flex h-14 items-center justify-between border-b px-4">
                <h3 className={cn("text-sm font-semibold", theme === "dark" ? "text-slate-100" : "text-slate-900")}>
                  Study Tools
                </h3>
                <button
                  onClick={onToggleStudyDrawer}
                  className="rounded-lg p-2"
                  aria-label="Close study drawer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="h-[calc(86vh-3.5rem)] min-h-0">{rightPanel}</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
