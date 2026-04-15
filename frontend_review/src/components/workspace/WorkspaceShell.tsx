"use client";

import { ReactNode } from "react";

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

type WorkspaceShellProps = {
  theme: "light" | "dark";
  showSidebar: boolean;
  isSidebarCollapsed: boolean;
  isStudyExpanded: boolean;
  onSidebarOverlayClick: () => void;
  sidebar: ReactNode;
  rightPanel?: ReactNode;
  showRightPanel?: boolean;
  children: ReactNode;
};

export function WorkspaceShell({
  theme,
  showSidebar,
  isSidebarCollapsed,
  isStudyExpanded,
  onSidebarOverlayClick,
  sidebar,
  rightPanel,
  showRightPanel = false,
  children,
}: WorkspaceShellProps) {
  return (
    <div className="h-[calc(100vh-4rem)] min-h-0">
      {showSidebar && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onSidebarOverlayClick}
        />
      )}

      <div
        className={cn(
          "h-full lg:grid",
          showRightPanel && rightPanel
            ? isStudyExpanded
              ? isSidebarCollapsed
                ? "lg:grid-cols-[72px_35%_65%]"
                : "lg:grid-cols-[16%_34%_50%]"
              : isSidebarCollapsed
              ? "lg:grid-cols-[72px_58%_42%]"
              : "lg:grid-cols-[20%_50%_30%]"
            : isSidebarCollapsed
            ? "lg:grid-cols-[72px_minmax(0,1fr)]"
            : "lg:grid-cols-[20%_80%]"
        )}
      >
        <aside
          className={cn(
            "fixed top-16 left-0 z-50 h-[calc(100vh-4rem)] w-[88vw] max-w-72 transform transition-all duration-300 ease-in-out sm:w-72 lg:static lg:z-10 lg:h-full lg:w-auto lg:max-w-none lg:translate-x-0 lg:border-r",
            theme === "dark"
              ? "bg-slate-950 lg:border-slate-800"
              : "bg-white lg:border-gray-200",
            showSidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          {sidebar}
        </aside>

        <section className="min-h-0 min-w-0 overflow-hidden">{children}</section>

        {showRightPanel && rightPanel && (
          <aside
            className={cn(
              "hidden min-h-0 min-w-0 overflow-hidden border-l lg:block",
              theme === "dark" ? "border-slate-800 bg-slate-950" : "border-slate-200 bg-slate-50/60"
            )}
          >
            {rightPanel}
          </aside>
        )}
      </div>
    </div>
  );
}
