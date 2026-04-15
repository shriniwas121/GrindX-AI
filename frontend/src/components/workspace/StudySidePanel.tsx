"use client";

import { BookOpen, Brain, Target, Award, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

type TabId = "chat" | "summary" | "concepts" | "practice" | "mock";

type StudySidePanelProps = {
  theme: "light" | "dark";
  activeTab: TabId;
  onSelectTab: (tab: Exclude<TabId, "chat">) => void;
  isTabLoading: boolean;
  tabContent: string;
  translatedTabContent: string;
  mockDifficulty: "easy" | "medium" | "hard";
  allowedMockDifficulties: string[];
  onSelectMockDifficulty: (difficulty: "easy" | "medium" | "hard") => void;
  quizData: unknown[];
  quizScore: number | null;
  currentQ: number;
};

const studyTabs: { id: Exclude<TabId, "chat">; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "summary", label: "Summary", icon: BookOpen },
  { id: "concepts", label: "Concepts", icon: Brain },
  { id: "practice", label: "Practice", icon: Target },
  { id: "mock", label: "Mock Test", icon: Award },
];

export function StudySidePanel({
  theme,
  activeTab,
  onSelectTab,
  isTabLoading,
  tabContent,
  translatedTabContent,
  mockDifficulty,
  allowedMockDifficulties,
  onSelectMockDifficulty,
  quizData,
  quizScore,
  currentQ,
}: StudySidePanelProps) {
  const isStudyTab = activeTab !== "chat";
  const content = translatedTabContent || tabContent;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          "border-b px-4 py-4",
          theme === "dark" ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"
        )}
      >
        <h3 className={cn("text-sm font-semibold", theme === "dark" ? "text-slate-100" : "text-slate-900")}>
          Study Workspace
        </h3>
        <p className={cn("mt-1 text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
          Summary, concepts, practice, and mock tools in one panel.
        </p>
      </div>

      <div
        className={cn(
          "border-b p-3",
          theme === "dark" ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"
        )}
      >
        <div className="grid grid-cols-2 gap-2">
          {studyTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-all",
                activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-sm"
                  : theme === "dark"
                  ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={cn("flex-1 min-h-0 overflow-y-auto px-4 py-4", theme === "dark" ? "bg-slate-950" : "bg-slate-50")}>
        {!isStudyTab ? (
          <div
            className={cn(
              "flex h-full flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center",
              theme === "dark" ? "border-slate-700 text-slate-300" : "border-slate-300 text-slate-600"
            )}
          >
            <MessageSquare className="mb-3 h-6 w-6 text-blue-500" />
            <p className="text-sm font-medium">Chat is active</p>
            <p className="mt-1 text-xs opacity-80">Pick a study tool above to view generated content here.</p>
          </div>
        ) : activeTab === "mock" ? (
          <div className="space-y-4">
            <div
              className={cn(
                "rounded-2xl border p-3",
                theme === "dark" ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
              )}
            >
              <p className={cn("text-xs font-semibold uppercase tracking-wide", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
                Difficulty
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["easy", "medium", "hard"] as const)
                  .filter((level) => allowedMockDifficulties.includes(level))
                  .map((level) => (
                    <button
                      key={level}
                      onClick={() => onSelectMockDifficulty(level)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                        mockDifficulty === level
                          ? "border-transparent bg-gradient-to-r from-blue-600 to-teal-600 text-white"
                          : theme === "dark"
                          ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      {level[0].toUpperCase() + level.slice(1)}
                    </button>
                  ))}
              </div>
            </div>

            <div
              className={cn(
                "rounded-2xl border p-3 text-sm",
                theme === "dark" ? "border-slate-700 bg-slate-900 text-slate-200" : "border-slate-200 bg-white text-slate-700"
              )}
            >
              <p>Questions generated: {quizData.length}</p>
              <p className="mt-1">Current question: {quizData.length ? currentQ + 1 : 0}</p>
              <p className="mt-1">Score: {quizScore === null ? "Not submitted" : `${quizScore}/${quizData.length}`}</p>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "prose prose-sm max-w-none",
              theme === "dark"
                ? "prose-headings:text-slate-100 prose-p:text-slate-300 prose-strong:text-slate-100 prose-li:text-slate-300"
                : "prose-headings:text-slate-900 prose-p:text-slate-700 prose-strong:text-slate-900 prose-li:text-slate-700"
            )}
          >
            {isTabLoading ? (
              <p className={cn("text-sm", theme === "dark" ? "text-slate-400" : "text-slate-500")}>Loading...</p>
            ) : content ? (
              <ReactMarkdown>{content}</ReactMarkdown>
            ) : (
              <p className={cn("text-sm", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
                Open this tool to generate content.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
