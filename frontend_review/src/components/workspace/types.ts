"use client";

export type WorkspaceTabId = "chat" | "summary" | "concepts" | "practice" | "mock" | "library" | "study";

export type LibraryItem = {
  id: string;
  name: string;
  type: "PDF" | "TXT" | "SAS" | "VIDEO" | "WEB" | "WORD";
  status: "Ready" | "Analyzed";
};

export type MobileNavProps = {
  theme: "light" | "dark";
  isStudyOpen: boolean;
  onOpenLibrary: () => void;
  onFocusChat: () => void;
  onToggleStudy: () => void;
};
