"use client";

import { BookOpen, Brain, Target, Award, MessageSquare, Maximize2, Minimize2, Send, Loader2, Mic, X } from "lucide-react";
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
  cleanContent: string;
  activeId: string;
  audioLimitMessage: string;
  chatLanguage: string;
  onLanguageChange: (language: string) => void;
  onTranslate: () => void;
  onSpeakTab: () => void;
  isAudioLoading: boolean;
  isTabSpeaking: boolean;
  mockDifficulty: "easy" | "medium" | "hard";
  allowedMockDifficulties: string[];
  onSelectMockDifficulty: (difficulty: "easy" | "medium" | "hard") => void;
  quizData: Array<{ question?: string; options?: string[]; correctAnswer?: number; explanation?: string }>;
  quizAnswers: Record<number, string>;
  onQuizAnswersChange: (next: Record<number, string>) => void;
  quizScore: number | null;
  onQuizScoreChange: (next: number | null) => void;
  currentQ: number;
  onCurrentQChange: (next: number) => void;
  onQuizSubmit: () => void;
  question: string;
  onQuestionChange: (value: string) => void;
  onAsk: () => void;
  isAsking: boolean;
  isStreaming: boolean;
  onStopAnswer: () => void;
  onVoiceInput: () => void;
  isListening: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
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
  cleanContent,
  activeId,
  audioLimitMessage,
  chatLanguage,
  onLanguageChange,
  onTranslate,
  onSpeakTab,
  isAudioLoading,
  isTabSpeaking,
  mockDifficulty,
  allowedMockDifficulties,
  onSelectMockDifficulty,
  quizData,
  quizAnswers,
  onQuizAnswersChange,
  quizScore,
  onQuizScoreChange,
  currentQ,
  onCurrentQChange,
  onQuizSubmit,
  question,
  onQuestionChange,
  onAsk,
  isAsking,
  isStreaming,
  onStopAnswer,
  onVoiceInput,
  isListening,
  isExpanded,
  onToggleExpanded,
}: StudySidePanelProps) {
  const isStudyTab = activeTab !== "chat" && Boolean(activeId);
  const content = translatedTabContent || tabContent;
  const showPracticeInput = activeTab === "practice" && isExpanded && Boolean(activeId);
  const canExpand = activeTab !== "chat" && Boolean(activeId);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          "border-b px-4 py-4",
          theme === "dark" ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className={cn("text-sm font-semibold", theme === "dark" ? "text-slate-100" : "text-slate-900")}>
              Study Workspace
            </h3>
            <p className={cn("mt-1 text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
              Summary, concepts, practice, and mock tools in one panel.
            </p>
          </div>
          {canExpand && (
            <button
              onClick={onToggleExpanded}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                theme === "dark"
                  ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              {isExpanded ? "Normal" : "Expand"}
            </button>
          )}
        </div>
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
        {!activeId ? (
          <div
            className={cn(
              "flex h-full flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center",
              theme === "dark" ? "border-slate-700 text-slate-300" : "border-slate-300 text-slate-600"
            )}
          >
            <MessageSquare className="mb-3 h-6 w-6 text-blue-500" />
            <p className="text-sm font-medium">Upload a document to begin</p>
            <p className="mt-1 text-xs opacity-80">Study tools will populate after document analysis.</p>
          </div>
        ) : !isStudyTab ? (
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

            {isTabLoading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="mb-3 h-6 w-6 animate-spin text-blue-600" />
                <p className={cn("text-sm", theme === "dark" ? "text-slate-300" : "text-slate-600")}>Generating mock test...</p>
              </div>
            ) : quizData.length === 0 ? (
              <div
                className={cn(
                  "rounded-2xl border p-4 text-sm",
                  theme === "dark" ? "border-slate-700 bg-slate-900 text-slate-200" : "border-slate-200 bg-white text-slate-700"
                )}
              >
                <p>No quiz available yet.</p>
                <p className="mt-1 text-xs opacity-80">Select Mock Test to generate questions from this document.</p>
              </div>
            ) : quizScore !== null ? (
              <div className="space-y-3">
                <div
                  className={cn(
                    "rounded-2xl border p-3 text-sm",
                    theme === "dark" ? "border-slate-700 bg-slate-900 text-slate-200" : "border-slate-200 bg-white text-slate-700"
                  )}
                >
                  <p className="font-semibold">Score: {quizScore} / {quizData.length}</p>
                  <p className="mt-1 text-xs">{Math.round((quizScore / quizData.length) * 100)}% correct</p>
                </div>
                <button
                  onClick={() => {
                    onQuizScoreChange(null);
                    onQuizAnswersChange({});
                    onCurrentQChange(0);
                  }}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 px-3 py-2 text-sm font-semibold text-white transition hover:from-blue-700 hover:to-teal-700"
                >
                  Retake Test
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  className={cn(
                    "rounded-2xl border p-3 text-sm",
                    theme === "dark" ? "border-slate-700 bg-slate-900 text-slate-200" : "border-slate-200 bg-white text-slate-700"
                  )}
                >
                  <p>
                    Question {currentQ + 1} of {quizData.length}
                  </p>
                </div>

                <div
                  className={cn(
                    "rounded-2xl border p-3",
                    theme === "dark" ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
                  )}
                >
                  <p className={cn("mb-3 text-sm font-semibold", theme === "dark" ? "text-slate-100" : "text-slate-900")}>
                    {quizData[currentQ]?.question}
                  </p>
                  <div className="space-y-2">
                    {quizData[currentQ]?.options?.map((option: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() =>
                          onQuizAnswersChange({
                            ...quizAnswers,
                            [currentQ]: String(idx),
                          })
                        }
                        className={cn(
                          "w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                          quizAnswers[currentQ] === String(idx)
                            ? "border-blue-500 bg-blue-500/10"
                            : theme === "dark"
                            ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => onCurrentQChange(Math.max(0, currentQ - 1))}
                    disabled={currentQ === 0}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50",
                      theme === "dark" ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    Previous
                  </button>
                  {currentQ === quizData.length - 1 ? (
                    <button
                      onClick={onQuizSubmit}
                      className="rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 px-3 py-2 text-sm font-semibold text-white transition hover:from-blue-700 hover:to-teal-700"
                    >
                      Finish Test
                    </button>
                  ) : (
                    <button
                      onClick={() => onCurrentQChange(Math.min(quizData.length - 1, currentQ + 1))}
                      className="rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 px-3 py-2 text-sm font-semibold text-white transition hover:from-blue-700 hover:to-teal-700"
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full min-h-0 flex-col">
            <div
              className={cn(
                "flex items-center justify-between gap-1 border-b px-2 py-2",
                theme === "dark" ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"
              )}
            >
              <div className="flex items-center gap-2">
                <select
                  value={chatLanguage}
                  onChange={(e) => onLanguageChange(e.target.value)}
                  className="rounded-xl border-2 border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="english">English</option>
                  <option value="hindi">Hindi</option>
                  <option value="french">French</option>
                  <option value="german">German</option>
                  <option value="spanish">Spanish</option>
                  <option value="arabic">Arabic</option>
                  <option value="japanese">Japanese</option>
                  <option value="chinese">chinese</option>
                </select>
                <button
                  onClick={onTranslate}
                  className="rounded-xl border-2 border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
                >
                  Translate
                </button>
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={onSpeakTab}
                  disabled={isAudioLoading}
                  className={cn(
                    "flex items-center gap-2 rounded-xl p-2 transition-colors",
                    isAudioLoading
                      ? "cursor-not-allowed bg-gray-100 text-gray-500"
                      : isTabSpeaking
                      ? "bg-blue-100 text-blue-600"
                      : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  )}
                >
                  {isAudioLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Processing...</span>
                    </>
                  ) : isTabSpeaking ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <MessageSquare className="h-5 w-5" />
                  )}
                </button>
                {audioLimitMessage && (
                  <div className="max-w-[220px] text-right text-[11px] leading-4 text-rose-600">{audioLimitMessage}</div>
                )}
              </div>
            </div>

            <div
              className={cn(
                "prose prose-sm max-w-none flex-1 min-h-0 overflow-y-auto px-4 py-4",
                theme === "dark"
                  ? "prose-headings:text-slate-100 prose-p:text-slate-300 prose-strong:text-slate-100 prose-li:text-slate-300"
                  : "prose-headings:text-slate-900 prose-p:text-slate-700 prose-strong:text-slate-900 prose-li:text-slate-700"
              )}
            >
              {isTabLoading ? (
                <p className={cn("text-sm", theme === "dark" ? "text-slate-400" : "text-slate-500")}>Loading...</p>
              ) : content ? (
                <ReactMarkdown>{cleanContent}</ReactMarkdown>
              ) : (
                <p className={cn("text-sm", theme === "dark" ? "text-slate-400" : "text-slate-500")}>
                  Open this tool to generate content.
                </p>
              )}
            </div>

            {showPracticeInput && (
              <div
                className={cn(
                  "border-t px-3 py-3",
                  theme === "dark" ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"
                )}
              >
                <div className="flex items-end gap-2">
                  <div className="relative flex-1">
                    <textarea
                      value={question}
                      onChange={(e) => onQuestionChange(e.target.value)}
                      onInput={(e) => {
                        const el = e.currentTarget;
                        el.style.height = "auto";
                        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          onAsk();
                        }
                      }}
                      placeholder="Ask about these practice questions..."
                      className={cn(
                        "min-h-[52px] max-h-40 w-full resize-none overflow-y-auto rounded-xl border-2 px-4 py-3 pr-12 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10",
                        theme === "dark"
                          ? "border-slate-700 bg-slate-950 !text-white caret-white placeholder:!text-slate-400"
                          : "border-gray-200 bg-white !text-slate-900 caret-slate-900 placeholder:!text-slate-400"
                      )}
                      rows={1}
                    />
                    <button
                      onClick={onVoiceInput}
                      className={cn(
                        "absolute bottom-3 right-3 rounded-lg p-1.5 transition-colors",
                        isListening ? "bg-red-100 text-red-600" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      )}
                    >
                      <Mic className="h-5 w-5" />
                    </button>
                  </div>
                  {isStreaming ? (
                    <button
                      onClick={onStopAnswer}
                      className="rounded-xl bg-red-500 p-3 text-white shadow-lg transition-all hover:bg-red-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  ) : (
                    <button
                      onClick={onAsk}
                      disabled={!question.trim() || isAsking}
                      className="rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 p-3 text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-700 hover:to-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
