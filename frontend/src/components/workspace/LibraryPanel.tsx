"use client";

import type { ReactNode } from "react";
import { LibrarySidebar } from "./LibrarySidebar";
import type { LibraryItem } from "./types";

type LibraryPanelProps = {
  theme: "light" | "dark";
  library: LibraryItem[];
  activeId: string;
  isCollapsed: boolean;
  showCloseButton?: boolean;
  onToggleCollapsed: () => void;
  onCloseSidebar: () => void;
  onStartNewDocument: () => void;
  onSelectItem: (id: string) => void;
  onRenameItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  bottomContent?: ReactNode;
};

export function LibraryPanel(props: LibraryPanelProps) {
  return (
    <LibrarySidebar
      theme={props.theme}
      library={props.library}
      activeId={props.activeId}
      isCollapsed={props.isCollapsed}
      onToggleCollapsed={props.onToggleCollapsed}
      showCloseButton={props.showCloseButton}
      onCloseSidebar={props.onCloseSidebar}
      onStartNewDocument={props.onStartNewDocument}
      onSelectItem={props.onSelectItem}
      onRenameItem={props.onRenameItem}
      onDeleteItem={props.onDeleteItem}
      bottomContent={props.bottomContent}
    />
  );
}
