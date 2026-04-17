"use client";

import { ReactNode } from "react";

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

type WorkspaceShellProps = {
  theme: "light" | "dark";
  showSidebar: boolean;
  isSidebarCollapsed: boolean;
  isStudyCollapsed: boolean;
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
  isStudyCollapsed,
  isStudyExpanded,
  onSidebarOverlayClick,
  sidebar,
  rightPanel,
  showRightPanel = false,
  children,
}: WorkspaceShellProps) {



  if (showRightPanel && rightPanel && isStudyExpanded) {
    return (
      <div
        className={cn(
          "relative h-[calc(100vh-4rem)] min-h-0",
          theme === "dark" ? "bg-slate-950" : "bg-slate-50"
        )}
      >
        {showSidebar && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={onSidebarOverlayClick}
          />
        )}
  
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 z-10 h-px",
            theme === "dark" ? "bg-slate-950" : "bg-slate-50"
          )}
        />
  
        <div
          className={cn(
            "h-full lg:grid",
            isSidebarCollapsed
              ? "lg:grid-cols-[72px_minmax(0,1fr)]"
              : "lg:grid-cols-[20%_minmax(0,1fr)]"
          )}
        >
          <aside
            className={cn(
              "fixed top-3 left-0 z-50 h-[calc(100dvh-5.5rem)] max-h-[calc(100dvh-5.5rem)] w-[88vw] max-w-72 transform transition-all duration-300 ease-in-out sm:w-72 lg:static lg:top-16 lg:left-0 lg:z-10 lg:h-full lg:max-h-none lg:w-auto lg:max-w-none lg:translate-x-0 lg:p-2",
              theme === "dark"
                ? "bg-slate-950 lg:bg-transparent"
                : "bg-white lg:bg-transparent",
              showSidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}
          >
            <div
              className={cn(
                "h-full min-h-0 overflow-hidden lg:rounded-[28px] lg:border lg:shadow-sm",
                theme === "dark"
                  ? "lg:border-slate-700 lg:bg-slate-950"
                  : "lg:border-slate-300 lg:bg-white"
              )}
            >
              {sidebar}
            </div>
          </aside>
  
          <section className="min-h-0 min-w-0 overflow-hidden lg:p-2">
            <div
              className={cn(
                "h-full min-h-0 overflow-hidden rounded-[28px] border shadow-sm",
                theme === "dark" ? "border-slate-700 bg-slate-950" : "border-slate-300 bg-white"
              )}
            >
              {rightPanel}
            </div>
          </section>
        </div>
      </div>
    );
  }


  return (
    <div
      className={cn(
        "relative h-[calc(100vh-4rem)] min-h-0",
        theme === "dark" ? "bg-slate-950" : "bg-slate-50"
      )}
    >
      {showSidebar && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onSidebarOverlayClick}
        />
      )}

      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-10 h-px",
          theme === "dark" ? "bg-slate-950" : "bg-slate-50"
        )}
      />

      <div
        className={cn(
          "h-full lg:grid",
          showRightPanel && rightPanel
            ? isSidebarCollapsed
              ? isStudyCollapsed
                ? "lg:grid-cols-[72px_minmax(0,1fr)_72px]"
                : "lg:grid-cols-[72px_minmax(0,1fr)_30%]"
              : isStudyCollapsed
              ? "lg:grid-cols-[20%_minmax(0,1fr)_72px]"
              : "lg:grid-cols-[20%_50%_30%]"
            : isSidebarCollapsed
            ? "lg:grid-cols-[72px_minmax(0,1fr)]"
            : "lg:grid-cols-[20%_80%]"
        )}
      >
        <aside
          className={cn(
            "fixed top-3 left-0 z-50 h-[calc(100dvh-5.5rem)] max-h-[calc(100dvh-5.5rem)] w-[88vw] max-w-72 transform transition-all duration-300 ease-in-out sm:w-72 lg:static lg:top-16 lg:left-0 lg:z-10 lg:h-full lg:max-h-none lg:w-auto lg:max-w-none lg:translate-x-0 lg:p-2",
            theme === "dark"
              ? "bg-slate-950 lg:bg-transparent"
              : "bg-white lg:bg-transparent",
            showSidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <div
            className={cn(
              "h-full min-h-0 overflow-hidden lg:rounded-[28px] lg:border lg:shadow-sm",
              theme === "dark"
                ? "lg:border-slate-700 lg:bg-slate-950"
                : "lg:border-slate-300 lg:bg-white"
            )}
          >
            {sidebar}
          </div>
        </aside>

        <section className="min-h-0 min-w-0 overflow-hidden">{children}</section>

        {showRightPanel && rightPanel && (
          <aside
            className="hidden min-h-0 min-w-0 overflow-hidden lg:block lg:p-2"
          >
            <div
              className={cn(
                "h-full min-h-0 overflow-hidden rounded-[28px] border shadow-sm",
                theme === "dark"
                  ? "border-slate-700 bg-slate-950"
                  : "border-slate-300 bg-white"
              )}
            >
              {rightPanel}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
