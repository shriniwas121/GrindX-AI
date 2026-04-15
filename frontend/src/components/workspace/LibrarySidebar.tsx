"use client";

import type { ReactNode } from "react";
import { BookOpen, ChevronLeft, ChevronRight, FileText, Globe, Library, Pencil, Plus, Trash2, Video, X } from "lucide-react";

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

type LibrarySidebarItem = {
  id: string;
  name: string;
  type: "PDF" | "TXT" | "SAS" | "VIDEO" | "WEB" | "WORD";
  status: "Ready" | "Analyzed";
};

type LibrarySidebarProps = {
  theme: "light" | "dark";
  library: LibrarySidebarItem[];
  activeId: string;
  showCloseButton?: boolean;
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
  onCloseSidebar: () => void;
  onStartNewDocument: () => void;
  onSelectItem: (id: string) => void;
  onRenameItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  footer?: ReactNode;
  bottomContent?: ReactNode;
};

export function LibrarySidebar({
  theme,
  library,
  activeId,
  showCloseButton = false,
  isCollapsed = false,
  onToggleCollapsed,
  onCloseSidebar,
  onStartNewDocument,
  onSelectItem,
  onRenameItem,
  onDeleteItem,
  footer,
  bottomContent,
}: LibrarySidebarProps) {
  if (isCollapsed) {
    return (
      <div className="flex h-full flex-col items-center py-3">
        <button
          onClick={onToggleCollapsed}
          className={cn(
            "mb-3 hidden h-8 w-8 items-center justify-center rounded-lg border lg:flex",
            theme === "dark"
              ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          )}
          aria-label="Expand library sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <button
          onClick={onStartNewDocument}
          className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-md"
          aria-label="New document"
        >
          <Plus className="h-4 w-4" />
        </button>

        <button
          onClick={onCloseSidebar}
          className={cn(
            "mb-3 flex h-8 w-8 items-center justify-center rounded-lg lg:hidden",
            theme === "dark"
              ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          )}
          aria-label="Close library panel"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mt-1 flex flex-col items-center gap-3">
          {library.slice(0, 6).map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectItem(item.id)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                activeId === item.id
                  ? "border-blue-500 bg-blue-500/20 text-blue-500"
                  : theme === "dark"
                  ? "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              )}
              aria-label={item.name}
              title={item.name}
            >
              {item.type === "VIDEO" ? (
                <Video className="h-4 w-4 text-red-600" />
              ) : item.type === "WEB" ? (
                <Globe className="h-4 w-4 text-teal-600" />
              ) : (
                <FileText className="h-4 w-4 text-blue-600" />
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-[28px] border shadow-sm overflow-hidden">
      <div className="p-4 space-y-2">
        <button
          onClick={onToggleCollapsed}
          className={cn(
            "hidden h-8 w-8 items-center justify-center rounded-lg border lg:flex",
            theme === "dark"
              ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          )}
          aria-label="Collapse library sidebar"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={onStartNewDocument}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-teal-700 shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          New Document
        </button>
      </div>

      <div
        className={cn(
          "flex items-center justify-between px-4 py-4 border-b transition-colors duration-300",
          theme === "dark" ? "border-slate-800" : "border-gray-100"
        )}
      >
        <div className="flex items-center gap-2">
          <Library className="w-5 h-5 text-blue-600" />
          <h2 className={cn("font-semibold", theme === "dark" ? "text-slate-100" : "text-gray-900")}>My Library</h2>
        </div>

        {showCloseButton && (
          <button
            onClick={onCloseSidebar}
            className={cn(
              "p-1.5 rounded-lg transition-colors lg:hidden",
              theme === "dark"
                ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            )}
            aria-label="Close library panel"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {library.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div
              className={cn(
                "p-4 rounded-2xl mb-4 transition-colors",
                theme === "dark" ? "bg-slate-800" : "bg-gray-100"
              )}
            >
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <p className={cn("text-sm", theme === "dark" ? "text-slate-300" : "text-gray-500")}>No documents yet</p>
            <p className={cn("text-xs mt-1", theme === "dark" ? "text-slate-500" : "text-gray-400")}>
              Upload your first study material
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {library.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "group relative p-3 rounded-xl cursor-pointer transition-all duration-200",
                  activeId === item.id
                    ? theme === "dark"
                      ? "bg-slate-800 border-2 border-blue-500/50 shadow-sm"
                      : "bg-gradient-to-r from-blue-50 to-teal-50 border-2 border-blue-200 shadow-sm"
                    : theme === "dark"
                    ? "bg-slate-900 border-2 border-transparent hover:bg-slate-800 hover:border-slate-700"
                    : "bg-gray-50 border-2 border-transparent hover:bg-gray-100 hover:border-gray-200"
                )}
                onClick={() => onSelectItem(item.id)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      activeId === item.id
                        ? theme === "dark"
                          ? "bg-blue-500/15"
                          : "bg-blue-100"
                        : theme === "dark"
                        ? "bg-slate-800"
                        : "bg-white"
                    )}
                  >
                    {item.type === "VIDEO" && <Video className="w-4 h-4 text-red-600" />}
                    {item.type === "WEB" && <Globe className="w-4 h-4 text-teal-600" />}
                    {(item.type === "PDF" || item.type === "TXT" || item.type === "WORD" || item.type === "SAS") && (
                      <FileText className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-medium text-sm truncate", theme === "dark" ? "text-slate-100" : "text-gray-900")}>
                      {item.name}
                    </p>
                    <p className={cn("text-xs mt-0.5", theme === "dark" ? "text-slate-400" : "text-gray-500")}>
                      {item.status}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRenameItem(item.id);
                      }}
                      className={cn(
                        "p-1.5 rounded-lg transition-all",
                        theme === "dark"
                          ? "text-slate-400 hover:text-blue-300 hover:bg-slate-800"
                          : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                      )}
                      aria-label={`Rename ${item.name}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteItem(item.id);
                      }}
                      className={cn(
                        "p-1.5 rounded-lg transition-all",
                        theme === "dark"
                          ? "text-slate-400 hover:text-red-300 hover:bg-slate-800"
                          : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                      )}
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {footer}
      </div>

      {bottomContent && (
        <div
          className={cn(
            "px-3 py-3",
            theme === "dark" ? "bg-slate-950" : "bg-white"
          )}
        >
          {bottomContent}
        </div>
      )}
    </div>
  );
}
