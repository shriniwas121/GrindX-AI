"use client";

import type { ReactNode } from "react";

type ChatPanelProps = {
  children: ReactNode;
};

export function ChatPanel({ children }: ChatPanelProps) {
  return <>{children}</>;
}
