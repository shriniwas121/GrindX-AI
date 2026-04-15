"use client";
import { supabase } from "@/lib/supabase";
import { useEffect, useState, useRef, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { LibrarySidebar } from "@/components/workspace/LibrarySidebar";
import { StudySidePanel } from "@/components/workspace/StudySidePanel";
import {
  BookOpen,
  Upload,
  Link2,
  Camera,
  Mic,
  Send,
  X,
  Menu,
  FileText,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Sparkles,
  Brain,
  Target,
  MessageSquare,
  GraduationCap,
  Zap,
  LogIn,
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Lightbulb,
  Award,
  TrendingUp,
  Sun,
  Moon,
} from "lucide-react";

// Simple cn utility - combines class names
function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  originalContent?: string;
  sourceType?: "document" | "external" | "none";
};

type LibraryItem = {
  id: string;
  name: string;
  type: "PDF" | "TXT" | "SAS" | "VIDEO" | "WEB" | "WORD";
  status: "Ready" | "Analyzed";
  summary: string;
  documentText: string;
  chatHistory: ChatMessage[];
  conceptsContent?: string;
  practiceContent?: string;
  mockContent?: {
    easy?: string;
    medium?: string;
    hard?: string;
  };
  mockQuizData?: {
    easy?: any[];
    medium?: any[];
    hard?: any[];
  };
};

// Google Icon Component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function Home() {
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioObj, setAudioObj] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [chatLanguage, setChatLanguage] = useState("english");
  const [tabLanguage, setTabLanguage] = useState("english");
  const [streamingText, setStreamingText] = useState("");
  const [summary, setSummary] = useState("");
  const [fileName, setFileName] = useState("");
  const [documentText, setDocumentText] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [chatAudio, setChatAudio] = useState<HTMLAudioElement | null>(null);
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [loadingChatAudioId, setLoadingChatAudioId] = useState<string | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isStudyExpanded, setIsStudyExpanded] = useState(false);
  const [showScreenshotPasteBox, setShowScreenshotPasteBox] = useState(false);
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [activeTab, setActiveTab] = useState<"chat" | "summary" | "concepts" | "practice" | "mock">("chat");
  const [tabContent, setTabContent] = useState("");
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [tabAudio, setTabAudio] = useState<HTMLAudioElement | null>(null);
  const [isTabSpeaking, setIsTabSpeaking] = useState(false);
  const [translatedTabContent, setTranslatedTabContent] = useState("");
  const [quizData, setQuizData] = useState<any[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [mockDifficulty, setMockDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [generalChat, setGeneralChat] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const askIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [authMessage, setAuthMessage] = useState("");

  const [profile, setProfile] = useState<{
    email?: string;
    tier?: string;
    full_name?: string;
    subscription_status?: string;
    trial_ends_at?: string | null;
    plan_ends_at?: string | null;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
    subscription_cancel_at_period_end?: boolean | null;
  } | null>(null);
  

  const [isBillingLoading, setIsBillingLoading] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);

  const [audioLimitMessage, setAudioLimitMessage] = useState("");
  const [showBillingActions, setShowBillingActions] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");


  const userLibraryKey = user?.id ? `grindx_library_${user.id}` : null;
  const userActiveIdKey = user?.id ? `grindx_active_id_${user.id}` : null;

  const urlInputRef = useRef<HTMLInputElement | null>(null);

  const uploadAbortRef = useRef<AbortController | null>(null);

  // RESTORE LIBRARY ON PAGE LOAD
  useEffect(() => {
    try {
      if (!userLibraryKey || !userActiveIdKey) {
        setLibrary([]);
        setActiveId("");
        return;
      }
  
      const savedLibrary = localStorage.getItem(userLibraryKey);
      const savedActiveId = localStorage.getItem(userActiveIdKey);
  
      if (!savedLibrary) {
        setLibrary([]);
        setActiveId("");
        return;
      }
  
      const parsed: LibraryItem[] = JSON.parse(savedLibrary);
  
      setLibrary(Array.isArray(parsed) ? parsed : []);
      setActiveId(savedActiveId || "");
      setFileName("");
      setSummary("");
      setDocumentText("");
      setQuestion("");
      setAnswer("");
      setStreamingText("");
      setActiveTab("chat");
      setTabContent("");
      setTranslatedTabContent("");
      setQuizData([]);
      setQuizAnswers({});
      setQuizScore(null);
      setCurrentQ(0);
      setChatLanguage("english");
      setTabLanguage("english");
    } catch (err) {
      console.error("Restore failed", err);
      setLibrary([]);
      setActiveId("");
    }
  }, [userLibraryKey, userActiveIdKey]);


  const handleGoogleSignIn = async () => {
    const redirectTo =
      window.location.hostname === "localhost"
        ? "http://localhost:3000"
        : "https://grindx.insightxai.com.au";
  
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  
    if (error) {
      setAuthMessage(error.message || "Google sign-in failed.");
    }
  };


  const clearPendingUploadState = () => {
    if (uploadAbortRef.current) {
      uploadAbortRef.current.abort();
      uploadAbortRef.current = null;
    }
    setIsUploading(false);
  };

  const clearWorkspaceState = () => {
    setLibrary([]);
    setActiveId("");
    setFileName("");
    setSummary("");
    setDocumentText("");
    setQuestion("");
    setAnswer("");
    setStreamingText("");
    setActiveTab("chat");
    setTabContent("");
    setTranslatedTabContent("");
    setQuizData([]);
    setQuizAnswers({});
    setQuizScore(null);
    setCurrentQ(0);
    setUrlInput("");
    setPastedText("");
    setIsUploading(false);
    setIsAsking(false);
  };


  const fetchProfile = async (userId: string) => {
    const { data: profileData, error } = await supabase
      .from("profiles")
      .select(
        "email, tier, full_name, subscription_status, trial_ends_at, plan_ends_at, stripe_customer_id, stripe_subscription_id, subscription_cancel_at_period_end"
      )
      .eq("id", userId)
      .single();
  
    if (error) {
      console.error("fetchProfile failed:", error);
      return null;
    }
  
    setProfile(profileData || null);
    return profileData || null;
  };


  const syncAuthState = async (session: any) => {
    const nextUser = session?.user ?? null;
    setUser(nextUser);
  
    if (!nextUser) {
      setProfile(null);
      clearWorkspaceState();
      return;
    }
  
    await supabase.from("profiles").upsert({
      id: nextUser.id,
      email: nextUser.email,
    });
  
    await fetchProfile(nextUser.id);
  };
  


  const formatPlanDate = (value?: string | null) => {
    if (!value) return "";
    return new Date(value).toLocaleDateString();
  };

  const currentTier = (profile?.tier || "free").toLowerCase();
  const isPremiumUser = currentTier === "premium";
  const isProUser = currentTier === "pro";
  const hasPaidPlan = isPremiumUser || isProUser;
  
  const allowedMockDifficulties =
    currentTier === "pro"
      ? ["easy", "medium", "hard"]
      : currentTier === "premium"
      ? ["easy", "medium"]
      : ["easy"];
  
  const getMaxDocumentSizeForTier = () => {
    if (currentTier === "premium") return 15 * 1024 * 1024;
    if (currentTier === "pro") return 30 * 1024 * 1024;
    return 5 * 1024 * 1024;
  };
  
  const getMaxImageSizeForTier = () => {
    if (currentTier === "premium") return 8 * 1024 * 1024;
    if (currentTier === "pro") return 15 * 1024 * 1024;
    return 3 * 1024 * 1024;
  };

  const hasUsedTrial = Boolean(
    profile?.subscription_status === "trialing" ||
    profile?.trial_ends_at ||
    profile?.stripe_customer_id
  );

  const canShowTrialEntry = !hasUsedTrial && !hasPaidPlan;


  const currentPlanLabel = isProUser ? "Pro" : isPremiumUser ? "Premium" : "Free";

  const handlePlanLimitReached = (
    message: string,
    kind: "chats" | "uploads" | "listens"
  ) => {
    const finalMsg = isProUser
      ? `${message} Your limit will reset when the next daily cycle starts.`
      : `${message} Upgrade your plan for more ${kind}.`;

    if (kind === "listens") {
      setAudioLimitMessage(finalMsg);
    }

    alert(finalMsg);

    if (!isProUser) {
      setShowPlansModal(true);
    }
  };

  const handlePlanSizeUpgrade = (message: string) => {
    if (isProUser) {
      alert(message);
      return;
    }

    alert(`${message} Upgrade your plan for larger file limits.`);
    setShowPlansModal(true);
  };


  const startCheckoutForPlan = async (plan: "premium" | "pro") => {
    if (!user) return;

    try {
      setIsBillingLoading(true);

      const res = await fetch(`${API}/billing/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_APP_API_KEY || "",
        },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
          plan,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || data?.message || `Unable to start ${plan} checkout.`);
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error("Stripe checkout URL not returned.");
    } catch (err: any) {
      alert(err.message || "Unable to start checkout.");
    } finally {
      setIsBillingLoading(false);
    }
  };

  const handleStartTrial = async () => {
    await startCheckoutForPlan("premium");
  };

  const handleUpgradeToPro = async () => {
    await startCheckoutForPlan("pro");
  };


  const handleManageSubscription = async () => {
    if (!user) return;

    try {
      setIsBillingLoading(true);

      const res = await fetch(`${API}/billing/create-portal-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_APP_API_KEY || "",
        },
        body: JSON.stringify({
          user_id: user.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || data?.message || "Unable to open subscription portal.");
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error("Stripe portal URL not returned.");
    } catch (err: any) {
      alert(err.message || "Unable to open subscription portal.");
    } finally {
      setIsBillingLoading(false);
    }
  };


  const handleCancelSubscription = async () => {
    if (!user) return;

    try {
      setIsBillingLoading(true);

      const res = await fetch(`${API}/billing/create-portal-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_APP_API_KEY || "",
        },
        body: JSON.stringify({
          user_id: user.id,
          action: "cancel",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || data?.message || "Unable to open cancel flow.");
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error("Stripe portal URL not returned.");
    } catch (err: any) {
      alert(err.message || "Unable to open cancel flow.");
    } finally {
      setIsBillingLoading(false);
    }
  };


  useEffect(() => {
    let mounted = true;
  
    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
  
      if (!mounted) return;
      await syncAuthState(session);
    };
  
    loadSession();
  
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      await syncAuthState(session);
    });
  
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);





  useEffect(() => {
    const savedTheme = localStorage.getItem("grindx_theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("grindx_theme", theme);
  }, [theme]);




  useEffect(() => {
    if (!user?.id) return;
  
    let cancelled = false;
  
    const refreshProfileFromBillingReturn = async () => {
      const params = new URLSearchParams(window.location.search);
      const billing = params.get("billing");
  
      if (!billing) return;
  
      if (billing === "cancel") {
        await fetchProfile(user.id);
        window.history.replaceState({}, "", window.location.pathname);
        return;
      }
  
      if (billing === "success") {
        let attempts = 0;
        const maxAttempts = 8;
  
        while (!cancelled && attempts < maxAttempts) {
          const latestProfile = await fetchProfile(user.id);
          const latestTier = (latestProfile?.tier || "free").toLowerCase();
  
          if (latestTier === "premium" || latestTier === "pro") {
            break;
          }
  
          attempts += 1;
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
  
        if (!cancelled) {
          window.history.replaceState({}, "", window.location.pathname);
        }
      }
    };
  
    const onFocus = async () => {
      if (!cancelled) {
        await fetchProfile(user.id);
      }
    };
  
    refreshProfileFromBillingReturn();
    window.addEventListener("focus", onFocus);
  
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, [user?.id]);






  // SAVE LIBRARY WHEN UPDATED
  useEffect(() => {
    if (!userLibraryKey) return;
    localStorage.setItem(userLibraryKey, JSON.stringify(library));
  }, [library, userLibraryKey]);


  useEffect(() => {
    if (!userActiveIdKey) return;
  
    if (activeId) {
      localStorage.setItem(userActiveIdKey, activeId);
    } else {
      localStorage.removeItem(userActiveIdKey);
    }
  }, [activeId, userActiveIdKey]);



  useEffect(() => {
    let alive = true;
  
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items || !alive) return;
  
      const imageItem = Array.from(items).find((item) =>
        item.type.startsWith("image/")
      );
  
      if (!imageItem) return;
  
      e.preventDefault();
      e.stopPropagation();
  

      const blob = imageItem.getAsFile();
      if (!blob) return;
  
      if (!(await requireSignedIn())) return;


      const maxSize = getMaxImageSizeForTier();
      if (blob.size > maxSize) {
        handlePlanSizeUpgrade(
          `Image too large. Your ${currentTier} plan allows up to ${Math.floor(
            maxSize / (1024 * 1024)
          )}MB images.`
        );
        return;
      }

 
      const usage = await checkAndConsumeUpload("screenshot", "Screenshot");
      if (!usage.allowed) {
        alert(usage.message);
        return;
      }
  
      resetCurrentDocumentView();
      setIsUploading(true);
  
      try {
        const formData = new FormData();
        formData.append("user_id", user?.id || "");
        formData.append("source_type", "screenshot");
        formData.append("file", blob);
  
        const res = await fetch(`${API}/ocr`, {
          method: "POST",
          body: formData,
        });
  
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText);
        }
  
        const ocrData = await res.json();
  
        const extractedText = ocrData.document_text || ocrData.text || "";
        if (!extractedText.trim()) {
          throw new Error("No text found in screenshot");
        }
  
        const formData2 = new FormData();
        formData2.append("user_id", user?.id || "");
        formData2.append("text", extractedText);
  
        const summaryRes = await fetch(`${API}/summarize-text`, {
          method: "POST",
          body: formData2,
        });
  
        if (!summaryRes.ok) {
          const errorText = await summaryRes.text();
          throw new Error(errorText);
        }
  

        const summaryData = await summaryRes.json();

        if (
          typeof summaryData?.summary === "string" &&
          summaryData.summary.toLowerCase().includes("daily limit reached")
        ) {
          handlePlanLimitReached(summaryData.summary, "uploads");
          return;
        }

        if (!alive) return;

        const safeSummary = summaryData.summary || "No summary available";



        const safeText = extractedText;
  
        const newItem: LibraryItem = {
          id: crypto.randomUUID(),
          name: "Screenshot",
          type: "TXT",
          status: "Analyzed",
          summary: safeSummary,
          documentText: safeText,
          chatHistory: [
            {
              role: "assistant",
              content: `Here's a quick overview:\n\n${safeSummary}`,
              sourceType: "document",
            },
          ],
        };
  
        setLibrary((prev) => [newItem, ...prev]);
        setActiveId(newItem.id);
        setFileName("Screenshot");
        setSummary(safeSummary);
        setDocumentText(safeText);
        setQuestion("");
        setAnswer("");
        setStreamingText("");
        setActiveTab("chat");
        setTabContent("");
        setTranslatedTabContent("");
        setQuizData([]);
        setQuizAnswers({});
        setQuizScore(null);
        setCurrentQ(0);
        setChatLanguage("english");
        setTabLanguage("english");
        setShowSidebar(false);
      } catch (err) {
        console.error(err);
        if (alive) {
          alert("Screenshot failed");
        }
      } finally {
        if (alive) {
          setIsUploading(false);
        }
      }
    };
  
    window.addEventListener("paste", handlePaste);
  
    return () => {
      alive = false;
      window.removeEventListener("paste", handlePaste);
    };
  }, [API, user, currentTier]);




  const cleanContent = useMemo(() => {
    return (translatedTabContent || tabContent || "").replace(/\n/g, "\n\n");
  }, [translatedTabContent, tabContent]);

  useEffect(() => {
    const el = chatEndRef.current;
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [streamingText, library, generalChat, activeId, isAsking]);

  const preventNewSourceWhileInDoc = () => {
    if (!activeId) return false;

    alert("You are already inside a document. Click New Chat before uploading, pasting, URL, or screenshot.");
    return true;
  };


  const requireSignedIn = async () => {
    if (user) return true;
  
    const {
      data: { session },
    } = await supabase.auth.getSession();
  
    if (session?.user) {
      await syncAuthState(session);
      return true;
    }
  
    setAuthMessage("Please sign in to upload and use your daily free limit.");
    setAuthMode("signin");
    setShowAuthModal(true);
    return false;
  };


  const checkAndConsumeUpload = async (
    sourceType: "file" | "url" | "pasted_text" | "camera" | "screenshot",
    fileName?: string
  ) => {
    const currentUser = user;
  
    if (!currentUser) {
      return {
        allowed: false,
        message: "Please sign in first.",
      };
    }
  
    return { allowed: true, message: "" };
  };


  const checkAndConsumeChat = async () => {
    const currentUser = user;
  
    if (!currentUser) {
      return {
        allowed: false,
        message: "Please sign in first.",
      };
    }
  
    return { allowed: true, message: "" };
  };

  const resetCurrentDocumentView = () => {
    clearPendingUploadState();
  
    setActiveId("");
    setFileName("");
    setSummary("");
    setDocumentText("");
    setQuestion("");
    setAnswer("");
    setStreamingText("");
    setActiveTab("chat");
    setTabContent("");
    setTranslatedTabContent("");
    setQuizData([]);
    setQuizAnswers({});
    setQuizScore(null);
    setCurrentQ(0);
    setUrlInput("");
    setPastedText("");
    setIsAsking(false);
  
    if (userActiveIdKey) {
      localStorage.removeItem(userActiveIdKey);
    }
  };


  const handleUploadButtonClick = async () => {
    if (!(await requireSignedIn())) return;
  
    resetCurrentDocumentView();
    setShowSidebar(false);
    document.getElementById("fileUpload")?.click();
  };


  const handleFileUpload = async (e: any) => {
    try {
      if (!(await requireSignedIn())) return;
  


      const file = e.target.files?.[0];
      if (!file) return;


      const maxSize = getMaxDocumentSizeForTier();
      if (file.size > maxSize) {
        handlePlanSizeUpgrade(
          `File too large. Your ${currentTier} plan allows up to ${Math.floor(
            maxSize / (1024 * 1024)
          )}MB documents.`
        );
        if (e?.target) {
          e.target.value = "";
        }
        return;
      }
  
      resetCurrentDocumentView();

  
      const usage = await checkAndConsumeUpload("file", file.name);
      if (!usage.allowed) {
        alert(usage.message);
        return;
      }
  
      setIsUploading(true);
  
      
      const formData = new FormData();
      formData.append("user_id", user?.id || "");
      formData.append("file", file);
  
      const res = await fetch(`${API}/summarize`, {
        method: "POST",
        body: formData,
      });
  
      if (!res.ok) throw new Error("Upload failed");
  

      const data = await res.json();

      if (
        typeof data?.summary === "string" &&
        data.summary.toLowerCase().includes("daily limit reached")
      ) {
        handlePlanLimitReached(data.summary, "uploads");
        return;
      }

      setFileName(data.filename);
      setDocumentText(data.document_text);
      setSummary(data.summary);

  
      const newItem: LibraryItem = {
        id: crypto.randomUUID(),
        name: data.filename,
        type: "TXT",
        status: "Analyzed",
        summary: data.summary,
        documentText: data.document_text,
        chatHistory: [
          {
            role: "assistant",
            content: `Here's a quick overview:\n\n${data.summary}`,
            sourceType: "document",
          },
        ],
      };
  
      setLibrary((prev) => [newItem, ...prev]);
      setActiveId(newItem.id);
      setQuestion("");
      setStreamingText("");
      setActiveTab("chat");
      setShowSidebar(false);

    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setIsUploading(false);
      if (e?.target) {
        e.target.value = "";
      }
    }
  };


  const handleUrlAnalyze = async (incomingUrl?: string) => {
    try {
      if (!(await requireSignedIn())) return;
  
      const finalUrl = (incomingUrl || urlInput).trim();
      if (!finalUrl) return;
  
      const usage = await checkAndConsumeUpload("url", finalUrl);
      if (!usage.allowed) {
        alert(usage.message);
        return;
      }
  
      resetCurrentDocumentView();
      setIsUploading(true);
      setAnswer("");
      setQuestion("");
  
      const formData = new FormData();
      formData.append("user_id", user?.id || "");
      let endpoint = "";


      let type: LibraryItem["type"] = "WEB";
  
      if (finalUrl.includes("youtube.com") || finalUrl.includes("youtu.be")) {
        formData.append("video_url", finalUrl);
        endpoint = `${API}/summarize-video`;
        type = "VIDEO";
      } else {
        formData.append("website_url", finalUrl);
        endpoint = `${API}/summarize-website`;
        type = "WEB";
      }
  
      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });
  
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }


      const data = await res.json();

      if (
        typeof data?.summary === "string" &&
        data.summary.toLowerCase().includes("daily limit reached")
      ) {
        handlePlanLimitReached(data.summary, "uploads");
        return;
      }

      const safeSummary =
        data.summary || data.document_text || data.text || data.transcript || data.content || "No summary available";  

  
      const safeText =
        data.document_text || data.text || data.transcript || data.content || "";
  
      const newItem: LibraryItem = {
        id: crypto.randomUUID(),
        name: finalUrl.length > 60 ? finalUrl.substring(0, 57) + "..." : finalUrl,
        type,
        status: "Analyzed",
        summary: safeSummary,
        documentText: safeText,
        chatHistory: [
          {
            role: "assistant",
            content: `Here's a quick overview:\n\n${safeSummary}`,
            sourceType: "document",
          },
        ],
      };
  
      setLibrary((prev) => [newItem, ...prev]);
      setActiveId(newItem.id);
      setFileName(data.filename || finalUrl);
      setSummary(safeSummary);
      setDocumentText(safeText);
      setQuestion("");
      setAnswer("");
      setStreamingText("");
      setActiveTab("chat");
      setTabContent("");
      setTranslatedTabContent("");
      setQuizData([]);
      setQuizAnswers({});
      setQuizScore(null);
      setCurrentQ(0);
      setChatLanguage("english");
      setTabLanguage("english");
      setUrlInput("");
      setShowSidebar(false);

    } catch (err) {
      console.error(err);
      setSummary("URL analysis failed. Check backend terminal.");
    } finally {
      setIsUploading(false);
    }
  };



  const handlePasteAnalyze = async (inputText?: string) => {
    if (!(await requireSignedIn())) return;
  
    const text = inputText || pastedText;
    if (!text.trim()) return;
  
    resetCurrentDocumentView();
  
    const usage = await checkAndConsumeUpload("pasted_text", "Pasted Text");
    if (!usage.allowed) {
      alert(usage.message);
      return;
    }
  
    try {
      setIsUploading(true);
  
      const formData = new FormData();
      formData.append("user_id", user?.id || "");
      formData.append("text", text);
  
      const res = await fetch(`${API}/summarize-text`, {
        method: "POST",
        body: formData,
      });
  

      const data = await res.json();

      if (
        typeof data?.summary === "string" &&
        data.summary.toLowerCase().includes("daily limit reached")
      ) {
        handlePlanLimitReached(data.summary, "uploads");
        return;
      }
  
      const newItem: LibraryItem = {
        id: crypto.randomUUID(),
        name: "Pasted Text",
        type: "TXT",
        status: "Analyzed",
        summary: data.summary,
        documentText: text,
        chatHistory: [
          {
            role: "assistant",
            content: data.summary,
            sourceType: "document",
          },
        ],
      };
  
      setLibrary((prev) => [newItem, ...prev]);
      setActiveId(newItem.id);
      setPastedText("");
      setActiveTab("chat");
      setShowSidebar(false);

    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };


  const handleCameraUpload = async (e: any) => {
    try {
      if (!(await requireSignedIn())) return;
  

      const file = e.target.files?.[0];
      if (!file) return;


      const maxSize = getMaxImageSizeForTier();
      if (file.size > maxSize) {
        handlePlanSizeUpgrade(
          `Image too large. Your ${currentTier} plan allows up to ${Math.floor(
            maxSize / (1024 * 1024)
          )}MB images.`
        );
        if (e?.target) {
          e.target.value = "";
        }
        return;
      }
  
      resetCurrentDocumentView();

  
      const usage = await checkAndConsumeUpload("camera", file.name || "Captured Image");
      if (!usage.allowed) {
        alert(usage.message);
        return;
      }
  
      setIsUploading(true);
  
      const formData = new FormData();
      formData.append("user_id", user?.id || "");
      formData.append("source_type", "camera");
      formData.append("file", file);
  
      const res = await fetch(`${API}/ocr`, {
        method: "POST",
        body: formData,
      });
  
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }
 
 

      const data = await res.json();

      if (
        typeof data?.summary === "string" &&
        data.summary.toLowerCase().includes("daily limit reached")
      ) {
        handlePlanLimitReached(data.summary, "uploads");
        return;
      }

      const safeSummary =
        data.summary || data.document_text || data.text || "No readable text found. Try clearer image.";


  
      const safeText =
        data.document_text || data.text || "No text found";
  
      setSummary(safeSummary);
      setFileName("Captured Image");
      setDocumentText(safeText);
  
      const newItem: LibraryItem = {
        id: crypto.randomUUID(),
        name: "Captured Image",
        type: "TXT",
        status: "Analyzed",
        summary: safeSummary,
        documentText: safeText,
        chatHistory: [
          {
            role: "assistant",
            content: `Extracted & summarized:\n\n${safeSummary}`,
            sourceType: "document",
          },
        ],
      };
  
      setLibrary((prev) => [newItem, ...prev]);
      setActiveId(newItem.id);
      setQuestion("");
      setAnswer("");
      setStreamingText("");
      setActiveTab("chat");
      setShowSidebar(false);

    } catch (err) {
      console.error(err);
      alert("Image processing failed");
    } finally {
      setIsUploading(false);
      if (e?.target) {
        e.target.value = "";
      }
    }
  };



  const handleStopAnswer = () => {
    if (askIntervalRef.current) {
      clearInterval(askIntervalRef.current);
      askIntervalRef.current = null;
    }

    setIsStreaming(false);
    setIsAsking(false);
  };


  const handleAsk = async (source: "chat" | "practice" = "chat") => {
    try {
      console.log("ASK MODE:", activeId ? "DOCUMENT" : "GENERAL");
  
      if (!question.trim() || isAsking) return;
  
      // URL DETECTION MUST HAPPEN BEFORE CHAT AUTH/USAGE
      const trimmed = question.trim();
  
      if (
        trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("www.")
      ) {
        const detectedUrl = trimmed.startsWith("www.") ? `https://${trimmed}` : trimmed;
        console.log("URL detected:", detectedUrl);
        setUrlInput(detectedUrl);
        setQuestion("");
        await handleUrlAnalyze(detectedUrl);
        return;
      }
  
      if (!(await requireSignedIn())) return;
      
      const chatUsage = await checkAndConsumeChat();
      if (!chatUsage.allowed) {
        alert(chatUsage.message);
        return;
      }
  
      setIsAsking(true);
  
      const userQuestion = question;
  
      if (!activeId) {
        return;
      }
 

      const activeItem = activeId
        ? library.find((item) => item.id === activeId)
        : null;
  
      const isGeneralChat = !activeId;
  
      if (isGeneralChat) {
        setIsAsking(false);
        return;
      }

      if (source === "practice" && activeTab !== "practice") {
        alert("Questions are only supported in Chat and Practice tabs.");
        setIsAsking(false);
        return;
      }
  
      if (activeId) {
        setLibrary((prev) =>
          prev.map((item) =>
            item.id === activeId
              ? {
                  ...item,
                  chatHistory: [
                    ...item.chatHistory,
                    { role: "user", content: userQuestion },
                    { role: "assistant", content: "" },
                  ],
                }
              : item
          )
        );
      } else {
        setGeneralChat((prev) => [
          ...prev,
          { role: "user", content: userQuestion },
          { role: "assistant", content: "" },
        ]);
      }
  
      const docText = source === "practice"
        ? tabContent || activeItem?.documentText || ""
        : activeItem?.documentText || "";
  
      const chatHistoryText = isGeneralChat
        ? ""
        : activeItem?.chatHistory
            ?.slice(-6)
            .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
            .join("\n") || "";
  
      const formData = new FormData();
      formData.append("user_id", user?.id || "");
      formData.append("question", userQuestion);
      formData.append("document_text", docText);
      formData.append("chat_history", chatHistoryText);
  
      const res = await fetch(`${API}/ask`, {
        method: "POST",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_APP_API_KEY || "",
        },
        body: formData,
      });
  
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }
  


      const data = await res.json();

      if (
        typeof data?.answer === "string" &&
        data.answer.toLowerCase().includes("daily chat limit reached")
      ) {
        handlePlanLimitReached(data.answer, "chats");
        return;
      }

      const fullText = data.answer;
      const sourceType = data.source_type || "none";


  
      setStreamingText("");
      setIsStreaming(true);
  
      let i = 0;
  
      askIntervalRef.current = setInterval(() => {
        const partial = fullText.slice(0, i + 1);
  
        if (i < fullText.length) {
          setStreamingText(partial);
  
          if (activeId) {
            setLibrary((prev) =>
              prev.map((item) =>
                item.id === activeId
                  ? {
                      ...item,
                      chatHistory: item.chatHistory.map((msg, idx, arr) =>
                        idx === arr.length - 1
                          ? { ...msg, content: partial, sourceType }
                          : msg
                      ),
                    }
                  : item
              )
            );
          } else {
            setGeneralChat((prev) =>
              prev.map((msg, idx, arr) =>
                idx === arr.length - 1
                  ? { ...msg, content: partial, sourceType: "external" }
                  : msg
              )
            );
          }
  
          i++;
        } else {
          if (askIntervalRef.current) {
            clearInterval(askIntervalRef.current);
            askIntervalRef.current = null;
          }
          setIsStreaming(false);
        }
      }, 20);
  
      setQuestion("");


    } catch (err: any) {
      console.error(err);

      const msg = err?.message || "Question failed. Check backend.";

      if (msg.toLowerCase().includes("daily chat limit reached")) {
        handlePlanLimitReached(msg, "chats");
      } else {
        alert(msg);
      }
    } finally {
      setIsAsking(false);
    }


  };



  const handleTabClick = async (
    tab: any,
    selectedDifficulty?: "easy" | "medium" | "hard"
  ) => {
    if (tabAudio) {
      tabAudio.pause();
      tabAudio.currentTime = 0;
      setTabAudio(null);
      setIsTabSpeaking(false);
    }
  
    setTranslatedTabContent("");
    setActiveTab(tab);
  
    if (tab === "chat") return;
  
    const activeItem = library.find((i) => i.id === activeId);
    if (!activeItem) return;
  
    let difficulty = selectedDifficulty || mockDifficulty;

    if (!allowedMockDifficulties.includes(difficulty)) {
      difficulty = "easy";
      setMockDifficulty("easy");
    }    
  
    // ---------- CACHE CHECK START ----------
    if (tab === "summary" && activeItem.summary?.trim()) {
      setTabContent(activeItem.summary);
      setQuizData([]);
      setQuizAnswers({});
      setQuizScore(null);
      setCurrentQ(0);
      return;
    }
  
    if (tab === "concepts" && activeItem.conceptsContent?.trim()) {
      setTabContent(activeItem.conceptsContent);
      setQuizData([]);
      setQuizAnswers({});
      setQuizScore(null);
      setCurrentQ(0);
      return;
    }
  
    if (tab === "practice" && activeItem.practiceContent?.trim()) {
      setTabContent(activeItem.practiceContent);
      setQuizData([]);
      setQuizAnswers({});
      setQuizScore(null);
      setCurrentQ(0);
      return;
    }
  
    if (tab === "mock") {
      const savedQuiz = activeItem.mockQuizData?.[difficulty];
      if (savedQuiz && savedQuiz.length > 0) {
        setQuizData(savedQuiz);
        setQuizAnswers({});
        setQuizScore(null);
        setCurrentQ(0);
        setTabContent(activeItem.mockContent?.[difficulty] || "");
        return;
      }
    }
    // ---------- CACHE CHECK END ----------
  
    setIsTabLoading(true);
    setTabContent("");
  
    try {

      const formData = new FormData();
      formData.append("text", activeItem.documentText);
      formData.append("user_id", user?.id || "");

      if (tab === "mock") {
        formData.append("difficulty", difficulty);
      }

  
      let endpoint = "";
  
      if (tab === "summary") endpoint = `${API}/summarize-text`;
      if (tab === "concepts") endpoint = `${API}/key-concepts`;
      if (tab === "practice") endpoint = `${API}/practice-questions`;
      if (tab === "mock") endpoint = `${API}/mock-test`;
  
      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });
  
      const data = await res.json();
      if (data?.error) {
        throw new Error(data.error);
      }

      let content = data.result || data.content || data.text || data.summary || "";
  

      if (tab === "practice") {
        let qNum = 0;
        let currentLabel = "";

        const lines = content
          .split("\n")
          .map((line: string) => line.trim())
          .filter(Boolean);

        const formatted: string[] = [];

        for (const line of lines) {
          const isMainHeading = /^practice questions on /i.test(line);

          const isSectionHeading =
            /^conceptual questions:?$/i.test(line) ||
            /^application questions:?$/i.test(line) ||
            /^scenario questions:?$/i.test(line) ||
            /^practice questions:?$/i.test(line);

          const labelMatch = line.match(/^([A-Za-z][A-Za-z\s\-&()]+):\s*(.+)$/);

          if (isMainHeading) {
            formatted.push(`**${line}**`, "");
            currentLabel = "";
            continue;
          }

          if (isSectionHeading) {
            formatted.push(`**${line.replace(/:$/, "")}**`, "");
            currentLabel = "";
            continue;
          }

          if (labelMatch) {
            const label = labelMatch[1].trim();
            const questionText = labelMatch[2].trim();

            qNum += 1;
            currentLabel = label;

            formatted.push(`${qNum}. **${label}**`, "");
            formatted.push(questionText, "");
            continue;
          }

          const looksLikeQuestion =
            line.endsWith("?") ||
            /determine|describe|explain|discuss|imagine|what|which|how|why/i.test(line);

          if (looksLikeQuestion) {
            qNum += 1;

            formatted.push(
              currentLabel
                ? `${qNum}. **${currentLabel}**`
                : `${qNum}. **Question ${qNum}**`,
              ""
            );
            formatted.push(line, "");
            currentLabel = "";
            continue;
          }

          formatted.push(line, "");
        }

        content = formatted.join("\n").replace(/\n{3,}/g, "\n\n").trim();
      }


 
  
      if (tab === "concepts") {
        const lines = content
          .split("\n")
          .map((line: string) => line.trim())
          .filter(Boolean)
          .map((line: string) => line.replace(/^[-•]\s*/, "").trim());
  
        const formatted: string[] = [];
  
        for (let i = 0; i < lines.length; i += 2) {
          const heading = lines[i];
          const description = lines[i + 1];
  
          if (!heading) continue;
  
          if (formatted.length > 0) {
            formatted.push("");
          }
  
          formatted.push(`**${heading}**`);
          formatted.push("");
  
          if (description) {
            formatted.push(description);
            formatted.push("");
          }
        }
  
        content = formatted.join("\n").replace(/\n{3,}/g, "\n\n").trim();
      }
  
      if (tab === "mock") {
        const questions = content.split(/\n(?=Question:)/);
  
        const parsed = questions.map((block: string) => {
          const lines = block.split("\n").map((l: string) => l.trim()).filter(Boolean);
  
          const questionLine = lines.find((l) => l.toLowerCase().startsWith("question:")) || "";
          const question = questionLine.replace(/^question:\s*/i, "").trim();
  
          const rawOptions = lines
            .filter((l) => /^[A-D][\).]\s/.test(l))
            .map((l) => ({
              text: l.replace(/^[A-D][\).]\s*/, "").trim(),
            }))
            .slice(0, 4);
  
          const correctOptionTextLine = lines.find((l) =>
            l.toLowerCase().startsWith("correctoptiontext:")
          );
  
          const correctOptionText = correctOptionTextLine
            ? correctOptionTextLine.replace(/correctoptiontext:\s*/i, "").trim()
            : "";
  
          const explanationLine = lines.find((l) =>
            l.toLowerCase().startsWith("explanation:")
          );
  
          const explanation = explanationLine
            ? explanationLine.replace(/explanation:\s*/i, "").trim()
            : "";
  
          if (!question || !correctOptionText || rawOptions.length !== 4) {
            return null;
          }
  
          const correctOptionExists = rawOptions.some(
            (o) => o.text.trim().toLowerCase() === correctOptionText.trim().toLowerCase()
          );
  
          if (!correctOptionExists) {
            return null;
          }
  
          const shuffled = [...rawOptions]
            .map((o) => ({ ...o, sortKey: Math.random() }))
            .sort((a, b) => a.sortKey - b.sortKey)
            .map(({ sortKey, ...rest }) => rest);
  
          const options = shuffled.map((o) => o.text);
  
          const newAnswerIndex = shuffled.findIndex(
            (o) => o.text.trim().toLowerCase() === correctOptionText.trim().toLowerCase()
          );
  
          if (newAnswerIndex < 0) {
            return null;
          }
  
          return {
            question,
            options,
            correctAnswer: newAnswerIndex,
            explanation,
          };
        });
  
        const cleaned = parsed.filter(
          (q: any) =>
            q &&
            q.question &&
            q.options &&
            q.options.length === 4 &&
            typeof q.correctAnswer === "number" &&
            q.correctAnswer >= 0 &&
            q.correctAnswer < 4
        );
  
        setQuizData(cleaned);
        setQuizAnswers({});
        setQuizScore(null);
        setCurrentQ(0);
        setChatLanguage("english");
        setTabContent("");
        setTranslatedTabContent("");
  
        setLibrary((prev) =>
          prev.map((item) =>
            item.id === activeId
              ? {
                  ...item,
                  mockContent: {
                    ...item.mockContent,
                    [difficulty]: content,
                  },
                  mockQuizData: {
                    ...item.mockQuizData,
                    [difficulty]: cleaned,
                  },
                }
              : item
          )
        );
      } else {
        setTabContent(content);
        setQuizData([]);
        setQuizScore(null);
        setCurrentQ(0);
        setQuizAnswers({});
  
        setLibrary((prev) =>
          prev.map((item) => {
            if (item.id !== activeId) return item;
  
            if (tab === "summary") {
              return { ...item, summary: content };
            }
  
            if (tab === "concepts") {
              return { ...item, conceptsContent: content };
            }
  
            if (tab === "practice") {
              return { ...item, practiceContent: content };
            }
  
            return item;
          })
        );
      }
    } catch (err) {
      console.error(err);
      setTabContent("Tab load failed.");
    } finally {
      setIsTabLoading(false);
    }
  };




  const handleLanguageChange = (language: string, scope: "auto" | "chat" | "tab" = "auto") => {
    if (scope === "chat") {
      setChatLanguage(language);
      return;
    }

    if (scope === "tab") {
      if (scope === "tab" ? activeTab === "mock" : activeTab === "mock") {
        setTabLanguage("english");
        setTranslatedTabContent("");
        return;
      }
      setTabLanguage(language);
      return;
    }

    if (activeTab === "chat") {
      setChatLanguage(language);
      return;
    }
  
    if (activeTab === "mock") {
      setTabLanguage("english");
      setTranslatedTabContent("");
      return;
    }
  
    setTabLanguage(language);
  };




  const handleTranslate = async (scope: "auto" | "chat" | "tab" = "auto") => {
    try {
      if (scope === "chat" || (scope === "auto" && activeTab === "chat")) {
        const activeItem = library.find((item) => item.id === activeId);
        if (!activeItem) return;
  
        const lastAssistantIndex =
          activeItem.chatHistory
            ?.map((msg, idx) => ({ ...msg, idx }))
            .filter((msg) => msg.role === "assistant" && msg.content?.trim())
            .slice(-1)[0]?.idx;
  
        if (lastAssistantIndex === undefined) return;
  
        const lastAssistantMessage = activeItem.chatHistory[lastAssistantIndex];
        if (!lastAssistantMessage) return;
  
        const originalText =
          lastAssistantMessage.originalContent || lastAssistantMessage.content;
  
        if (!originalText.trim()) return;
  
        if (chatLanguage === "english") {
          setLibrary((prev) =>
            prev.map((item) =>
              item.id === activeId
                ? {
                    ...item,
                    chatHistory: item.chatHistory.map((msg, idx) =>
                      idx === lastAssistantIndex
                        ? {
                            ...msg,
                            content: msg.originalContent || msg.content,
                          }
                        : msg
                    ),
                  }
                : item
            )
          );
          return;
        }
  
        const formData = new FormData();
        formData.append("text", originalText);
        formData.append("language", chatLanguage);
  
        const res = await fetch(`${API}/translate`, {
          method: "POST",
          body: formData,
        });
  
        const data = await res.json();
        const translatedText =
          data.translated_text || data.translated || originalText;
  
        setLibrary((prev) =>
          prev.map((item) =>
            item.id === activeId
              ? {
                  ...item,
                  chatHistory: item.chatHistory.map((msg, idx) =>
                    idx === lastAssistantIndex
                      ? {
                          ...msg,
                          originalContent: msg.originalContent || msg.content,
                          content: translatedText,
                        }
                      : msg
                  ),
                }
              : item
          )
        );
  
        return;
      }
  

      if (scope === "tab" && activeTab === "mock") {
        setTranslatedTabContent("");
        setTabLanguage("english");
        return;
      }
      
      const textToTranslate = tabContent;
      
      if (!textToTranslate) return;
      
      if (tabLanguage === "english") {
        setTranslatedTabContent("");
        return;
      }
      
      const formData = new FormData();
      formData.append("text", textToTranslate);
      formData.append("language", tabLanguage);
      
      const res = await fetch(`${API}/translate`, {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      setTranslatedTabContent(data.translated || data.translated_text || textToTranslate);

    } catch (err) {
      console.error(err);
    }
  };


  const handleSpeakTab = async () => {
    if (!(await requireSignedIn())) return;

    setAudioLimitMessage("");

    if (isTabSpeaking && tabAudio) {
      tabAudio.pause();
      tabAudio.currentTime = 0;
      setTabAudio(null);
      setIsTabSpeaking(false);
      return;
    }

    let textToSpeak = "";

    if (activeTab === "mock") {
      const q = quizData[currentQ] || {};
      textToSpeak =
        translatedTabContent || `${q.question || ""}\n${(q.options || []).join("\n")}`;
    } else {
      textToSpeak = translatedTabContent || tabContent;
    }

    if (!textToSpeak?.trim()) return;

    setIsAudioLoading(true);

    try {
      const formData = new FormData();
      formData.append("text", textToSpeak);
      formData.append("language", tabLanguage);
      formData.append("user_id", user?.id || "");

      const res = await fetch(`${API}/speak`, {
        method: "POST",
        body: formData,
      });

      const contentType = res.headers.get("content-type") || "";

      if (!res.ok || contentType.includes("application/json")) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.error || errorData?.detail || "Unable to generate audio."
        );
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const newAudio = new Audio(audioUrl);

      newAudio.onended = () => {
        setIsTabSpeaking(false);
        setTabAudio(null);
        URL.revokeObjectURL(audioUrl);
      };

      await newAudio.play();
      setTabAudio(newAudio);
      setIsTabSpeaking(true);
      setAudioLimitMessage("");
    } catch (err: any) {
      console.error(err);

      const msg = err?.message || "Audio playback failed.";


      if (msg.toLowerCase().includes("daily audio limit reached")) {
        const finalMsg = isProUser
          ? `${msg} Your audio limit will reset when the next daily cycle starts.`
          : `${msg} Upgrade your plan for more listens.`;

        setAudioLimitMessage(finalMsg);
        alert(finalMsg);

        if (!isProUser) {
          setShowPlansModal(true);
        }
      } else {
        alert(msg);
      }


    } finally {
      setIsAudioLoading(false);
    }
  };



  const handleSpeakChat = async (idx: number, text: string) => {
    if (!(await requireSignedIn())) return;

    setAudioLimitMessage("");

    const currentAudioId = `${activeId}-${idx}`;

    if (chatAudio) {
      chatAudio.pause();
      chatAudio.currentTime = 0;
      setChatAudio(null);
      setActiveAudioId(null);
    }

    if (activeAudioId === currentAudioId) {
      setActiveAudioId(null);
      setLoadingChatAudioId(null);
      return;
    }

    if (!text?.trim()) return;

    setIsLoadingAudio(true);
    setLoadingChatAudioId(currentAudioId);

    try {
      const formData = new FormData();
      formData.append("text", text);
      formData.append("language", chatLanguage);
      formData.append("user_id", user?.id || "");

      const res = await fetch(`${API}/speak`, {
        method: "POST",
        body: formData,
      });

      const contentType = res.headers.get("content-type") || "";

      if (!res.ok || contentType.includes("application/json")) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.error || errorData?.detail || "Unable to generate audio."
        );
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const newAudio = new Audio(audioUrl);

      newAudio.onended = () => {
        setActiveAudioId(null);
        setChatAudio(null);
        setLoadingChatAudioId(null);
        URL.revokeObjectURL(audioUrl);
      };

      await newAudio.play();
      setChatAudio(newAudio);
      setActiveAudioId(currentAudioId);
      setAudioLimitMessage("");
    } catch (err: any) {
      console.error(err);

      const msg = err?.message || "Audio playback failed.";


      if (msg.toLowerCase().includes("daily audio limit reached")) {
        const finalMsg = isProUser
          ? `${msg} Your audio limit will reset when the next daily cycle starts.`
          : `${msg} Upgrade your plan for more listens.`;

        setAudioLimitMessage(finalMsg);
        alert(finalMsg);

        if (!isProUser) {
          setShowPlansModal(true);
        }
      } else {
        alert(msg);
      }



    } finally {
      setIsLoadingAudio(false);
      setLoadingChatAudioId(null);
    }
  };




  const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported.");
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(transcript);
    };

    recognition.start();
  };


  const handleSelectItem = (item: LibraryItem) => {
    setActiveId(item.id);
    setFileName(item.name);
    setSummary(item.summary);
    setDocumentText(item.documentText);
    setQuestion("");
    setAnswer("");
    setStreamingText("");
    setActiveTab("chat");
    setTabContent("");
    setTranslatedTabContent("");
    setQuizData(item.mockQuizData?.[mockDifficulty] || []);
    setQuizAnswers({});
    setQuizScore(null);
    setCurrentQ(0);
    setChatLanguage("english");
    setTabLanguage("english");
    setShowSidebar(false);
  };



  const handleDeleteItem = (id: string) => {
    setLibrary(prev => prev.filter(item => item.id !== id));

    if (activeId === id) {
      setActiveId("");
      setFileName("");
      setSummary("");
      setDocumentText("");
      setQuestion("");
      setAnswer("");
      setStreamingText("");
      setActiveTab("chat");
      setTabContent("");
      setTranslatedTabContent("");
      setQuizData([]);
      setQuizAnswers({});
      setQuizScore(null);
      setCurrentQ(0);
    }
  };

  const handleRename = (id: string) => {
    const newName = prompt("Enter new name:");
    if (!newName) return;
    setLibrary(prev => prev.map(item =>
      item.id === id ? { ...item, name: newName } : item
    ));
  };


  const startNewChat = () => {
    clearPendingUploadState();
  
    setActiveId("");
    setFileName("");
    setSummary("");
    setDocumentText("");
    setQuestion("");
    setAnswer("");
    setStreamingText("");
    setActiveTab("chat");
    setTabContent("");
    setTranslatedTabContent("");
    setQuizData([]);
    setQuizAnswers({});
    setQuizScore(null);
    setCurrentQ(0);
    setUrlInput("");
    setPastedText("");
    setIsAsking(false);
    setShowSidebar(false);
  
    if (userActiveIdKey) {
      localStorage.removeItem(userActiveIdKey);
    }
  };



  const activeItem = library.find(i => i.id === activeId);

  const chatHistory: ChatMessage[] = activeId
    ? activeItem?.chatHistory || []
    : generalChat;

  const handleQuizSubmit = () => {
    let correctCount = 0;

    quizData.forEach((q, i) => {
      const selectedIdx = parseInt(quizAnswers[i] || "-1", 10);
      if (selectedIdx === q.correctAnswer) {
        correctCount++;
      }
    });

    setQuizScore(correctCount);
  };


  const handleForgotPassword = async () => {
    if (!authEmail.trim()) {
      setAuthMessage("Please enter your email address first.");
      return;
    }
  
    setIsAuthLoading(true);
    setAuthMessage("");
  
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
        redirectTo:
          window.location.hostname === "localhost"
            ? "http://localhost:3000/update-password"
            : "https://grindx.insightxai.com.au/update-password",
      });
  
      if (error) throw error;
  
      setAuthMessage("Password reset email sent. Please check your inbox.");
    } catch (err: any) {
      setAuthMessage(err.message || "Could not send password reset email.");
    } finally {
      setIsAuthLoading(false);
    }
  };


  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthMessage("");
  
    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        });
  
        if (error) throw error;
  
        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            email: data.user.email,
            full_name: authName,
            tier: "free",
          });
        }
  
        setAuthMessage("Account created successfully. Please sign in.");
        setAuthMode("signin");
        return;
      }
  
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });
  
      if (error) throw error;
  
      await syncAuthState(data.session);
  
      setShowAuthModal(false);
      setAuthEmail("");
      setAuthPassword("");
      setAuthName("");
      setAuthMessage("");
      setShowSidebar(false);
    } catch (err: any) {
      setAuthMessage(err.message || "Authentication failed.");
    } finally {
      setIsAuthLoading(false);
    }
  };


  const handleSignOut = async () => {
    try {
      setShowAuthModal(false);
      setAuthMessage("");
      setShowSidebar(false);
      setShowPlansModal(false);
      setShowBillingActions(false);
      setProfile(null);
      setUser(null);
      clearWorkspaceState();

      await supabase.auth.signOut();

      window.location.href = "https://grindx.insightxai.com.au";
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };



  const tabs = [
    { id: "chat" as const, label: "Chat", icon: MessageSquare },
    { id: "summary" as const, label: "Summary", icon: BookOpen },
    { id: "concepts" as const, label: "Concepts", icon: Brain },
    { id: "practice" as const, label: "Practice", icon: Target },
    { id: "mock" as const, label: "Mock Test", icon: Award },
  ];

  const desktopStudyPanel = (
    <StudySidePanel
      theme={theme}
      activeTab={activeTab}
      onSelectTab={(tab) => handleTabClick(tab)}
      isTabLoading={isTabLoading}
      tabContent={tabContent}
      translatedTabContent={translatedTabContent}
      cleanContent={cleanContent}
      activeId={activeId}
      audioLimitMessage={audioLimitMessage}
      chatLanguage={chatLanguage}
      onLanguageChange={(language) => handleLanguageChange(language, "tab")}
      onTranslate={() => handleTranslate("tab")}
      onSpeakTab={handleSpeakTab}
      isAudioLoading={isAudioLoading}
      isTabSpeaking={isTabSpeaking}
      mockDifficulty={mockDifficulty}
      allowedMockDifficulties={allowedMockDifficulties}
      onSelectMockDifficulty={(difficulty) => {
        setMockDifficulty(difficulty);
        setQuizAnswers({});
        setQuizScore(null);
        setCurrentQ(0);
        setTranslatedTabContent("");
        handleTabClick("mock", difficulty);
      }}
      quizData={quizData}
      quizAnswers={quizAnswers}
      onQuizAnswersChange={setQuizAnswers}
      quizScore={quizScore}
      onQuizScoreChange={setQuizScore}
      currentQ={currentQ}
      onCurrentQChange={setCurrentQ}
      onQuizSubmit={handleQuizSubmit}
      isExpanded={isStudyExpanded}
      onToggleExpanded={() => setIsStudyExpanded((prev) => !prev)}
    />
  );


  return (
    <div
      className={cn(
        "min-h-screen transition-colors duration-300",
        theme === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      )}
      style={{ colorScheme: theme }}
    >


      {/* Plans Modal */}
      {showPlansModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl rounded-3xl bg-white shadow-2xl overflow-hidden">

            <button
              onClick={() => setShowPlansModal(false)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white shadow-sm ring-1 ring-white/30 transition hover:bg-white/25 hover:text-white"
              aria-label="Close plans modal"
            >
              <X className="h-5 w-5" />
            </button>


            <div className="border-b border-slate-200 bg-gradient-to-r from-blue-600 via-blue-700 to-teal-600 px-6 py-6 text-white md:px-8">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/15 p-2">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Choose your plan</h2>
                  <p className="mt-1 text-sm text-blue-100">
                    Start free, upgrade only when you need more power.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-3 md:p-8">
              {/* Free */}
              <div className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <div className="mb-4">
                  <div className="text-sm font-semibold text-slate-500">Free</div>
                  <div className="mt-2 text-3xl font-bold text-slate-900">$0</div>
                  <div className="mt-1 text-sm text-slate-500">Good for getting started</div>
                </div>

                <div className="space-y-2 text-sm text-slate-700">
                  <div>• 5 uploads per day</div>
                  <div>• 15 prompts per day</div>
                  <div>• 3 listens per day</div>
                  <div>• Up to 5MB documents</div>
                  <div>• Up to 3MB camera/screenshot</div>
                  <div>• Summary</div>
                  <div>• Key Concepts</div>
                  <div>• Practice Questions</div>
                  <div>• Easy Mock Test only</div>
                </div>

                <div className="mt-6">
                  {currentTier === "free" ? (
                    <button
                      disabled
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-500"
                    >
                      Current Plan
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-400"
                    >
                      Free Plan
                    </button>
                  )}
                </div>
              </div>

              {/* Premium */}
              <div className="relative flex flex-col rounded-2xl border-2 border-emerald-500 bg-white p-5 shadow-sm">
                <div className="absolute -top-3 left-5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
                  Most Popular
                </div>

                <div className="mb-4">
                  <div className="text-sm font-semibold text-emerald-600">Premium</div>
                  <div className="mt-2 text-3xl font-bold text-slate-900">$5.99</div>
                  <div className="mt-1 text-sm text-slate-500">per month</div>
                </div>


                <div className="space-y-2 text-sm text-slate-700">
                  <div>• 15 uploads per day</div>
                  <div>• 100 prompts per day</div>
                  <div>• 30 listens per day</div>
                  <div>• Up to 15MB documents</div>
                  <div>• Up to 8MB camera/screenshot</div>
                  <div>• Summary</div>
                  <div>• Key Concepts</div>
                  <div>• Practice Questions</div>
                  <div>• Easy + Medium Mock Test</div>
                  <div>• Faster study flow</div>
                </div>


                <div className="mt-6">

                  {isPremiumUser ? (
                    <div className="space-y-2">
                      <button
                        onClick={handleManageSubscription}
                        disabled={isBillingLoading}
                        className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isBillingLoading ? "Please wait..." : "Manage Subscription"}
                      </button>

                      <button
                        onClick={handleCancelSubscription}
                        disabled={isBillingLoading}
                        className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isBillingLoading ? "Please wait..." : "Cancel Subscription"}
                      </button>
                    </div>
                  ) : isProUser ? (

                    <button
                      disabled
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-500"
                    >
                      Included Below Current Plan
                    </button>
                  ) : canShowTrialEntry ? (
                    <button
                      onClick={handleStartTrial}
                      disabled={isBillingLoading}
                      className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isBillingLoading ? "Please wait..." : "Start 7-Day Free Trial"}
                    </button>
                  ) : (
                    <button
                      onClick={() => startCheckoutForPlan("premium")}
                      disabled={isBillingLoading}
                      className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isBillingLoading ? "Please wait..." : "Get Premium"}
                    </button>
                  )}
                </div>
              </div>

              {/* Pro */}
              <div className="flex flex-col rounded-2xl border border-violet-200 bg-violet-50/40 p-5">
                <div className="mb-4">
                  <div className="text-sm font-semibold text-violet-600">Pro</div>
                  <div className="mt-2 text-3xl font-bold text-slate-900">$14.99</div>
                  <div className="mt-1 text-sm text-slate-500">per month</div>
                </div>

                <div className="space-y-2 text-sm text-slate-700">
                  <div>• 50 uploads per day</div>
                  <div>• 500 prompts per day</div>
                  <div>• 100 listens per day</div>
                  <div>• Up to 30MB documents</div>
                  <div>• Up to 15MB camera/screenshot</div>
                  <div>• Summary</div>
                  <div>• Key Concepts</div>
                  <div>• Practice Questions</div>
                  <div>• Easy + Medium + Hard Mock Test</div>
                  <div>• Highest usage limits</div>
                </div>

                <div className="mt-6">


                  {isProUser ? (
                    <div className="space-y-2">
                      <button
                        onClick={handleManageSubscription}
                        disabled={isBillingLoading}
                        className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isBillingLoading ? "Please wait..." : "Manage Subscription"}
                      </button>

                      <button
                        onClick={handleCancelSubscription}
                        disabled={isBillingLoading}
                        className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isBillingLoading ? "Please wait..." : "Cancel Subscription"}
                      </button>
                    </div>
                  ) : (

                    <button
                      onClick={handleUpgradeToPro}
                      disabled={isBillingLoading}
                      className="w-full rounded-xl border border-violet-300 bg-violet-100 px-4 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isBillingLoading ? "Please wait..." : "Upgrade to Pro"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-center text-xs text-slate-500 md:px-8">
              Cancel anytime. Paid plans stay active until the current billing period ends.
            </div>
          </div>
        </div>
      )}


      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="relative px-8 pt-8 pb-6 bg-gradient-to-br from-blue-600 via-blue-700 to-teal-600 text-white">
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-xl">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <span className="text-xl font-bold">Grindx AI</span>
              </div>
              <h2 className="text-2xl font-bold">
                {authMode === "signin" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-blue-100 mt-1">
                {authMode === "signin"
                  ? "Sign in to continue your learning journey"
                  : "Join thousands of students learning smarter"}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-8">
              <button
                onClick={handleGoogleSignIn}
                disabled={isAuthLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-sm text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === "signup" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {authMode === "signin" && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}


                {authMessage && (
                  <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    {authMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-teal-700 focus:ring-4 focus:ring-blue-500/30 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAuthLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {authMode === "signin" ? "Signing in..." : "Creating account..."}
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      {authMode === "signin" ? "Sign In" : "Create Account"}
                    </>
                  )}
                </button>
              </form>

              {/* Toggle Auth Mode */}
              <p className="text-center text-gray-600 mt-6">
                {authMode === "signin" ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}
                  className="text-blue-600 font-semibold hover:text-blue-700"
                >
                  {authMode === "signin" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header
        className={cn(
          "sticky top-0 z-40 backdrop-blur-xl border-b shadow-sm transition-colors duration-300",
          theme === "dark"
            ? "bg-slate-950/85 border-slate-800"
            : "bg-white/80 border-gray-200/50"
        )}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Left: Menu + Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSidebar(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors lg:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-teal-500 rounded-xl shadow-lg shadow-blue-500/25">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-teal-600 bg-clip-text text-transparent">
                    Grindx AI
                  </h1>
                  <p className="text-xs text-gray-500 hidden sm:block">Intelligent Study Assistant</p>
                </div>
              </div>
            </div>


            {/* Center: Document Name */}
            {activeItem && (
              <div className="hidden md:flex min-w-0 items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-100 rounded-full">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700 max-w-[160px] lg:max-w-[220px] truncate">
                  {activeItem.name}
                </span>
              </div>
            )}

            {/* Right: Sign In */}

            {/*Dark OR Light Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200",
                  theme === "dark"
                    ? "bg-slate-900 border-slate-700 text-slate-100 hover:bg-slate-800"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm font-medium">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm font-medium">Dark</span>
                  </>
                )}
              </button>

              {user ? (
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-teal-700 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setAuthMessage("");
                    setAuthMode("signin");
                    setShowAuthModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-teal-700 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}
            </div>


          </div>
        </div>
      </header>

      <WorkspaceShell
        theme={theme}
        showSidebar={showSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
        isStudyExpanded={isStudyExpanded}
        onSidebarOverlayClick={() => setShowSidebar(false)}
        showRightPanel={true}
        sidebar={
          <LibrarySidebar
            theme={theme}
            library={library}
            activeId={activeId}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapsed={() => setIsSidebarCollapsed((prev) => !prev)}
            showCloseButton
            onCloseSidebar={() => setShowSidebar(false)}
            onStartNewDocument={startNewChat}
            onSelectItem={(id) => {
              const selectedItem = library.find((item) => item.id === id);
              if (selectedItem) {
                handleSelectItem(selectedItem);
              }
            }}
            onRenameItem={handleRename}
            onDeleteItem={handleDeleteItem}
            bottomContent={
              user && (
                <div
                  className={cn(
                    "rounded-lg border px-2 py-1.5 shadow-sm transition-colors duration-300",
                    theme === "dark"
                      ? "border-slate-700 bg-slate-900"
                      : "border-slate-200 bg-white/80"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => setShowBillingActions((prev) => !prev)}
                      className={cn(
                        "flex w-full items-start gap-2 rounded-lg text-left transition p-0.5",
                        theme === "dark" ? "hover:bg-slate-800" : "hover:bg-slate-50"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full text-white text-[10px] font-semibold uppercase shrink-0",
                          theme === "dark" ? "bg-slate-600" : "bg-slate-400"
                        )}
                      >
                        {(profile?.full_name || profile?.email || user.email || "U").charAt(0)}
                      </div>
              
                      <div className="min-w-0 flex-1">
                        <div
                          className={cn(
                            "truncate text-[11px] font-semibold leading-4",
                            theme === "dark" ? "text-slate-100" : "text-slate-900"
                          )}
                        >
                          {profile?.full_name || profile?.email || user.email}
                        </div>
              
                        <div
                          className={cn(
                            "mt-0.5 text-[10px] font-medium leading-4",
                            theme === "dark" ? "text-slate-300" : "text-slate-600"
                          )}
                        >
                          Current plan:{" "}
                          <span
                            className={
                              isProUser
                                ? "text-violet-600"
                                : isPremiumUser
                                ? "text-emerald-600"
                                : theme === "dark"
                                ? "text-slate-300"
                                : "text-slate-700"
                            }
                          >
                            {currentPlanLabel}
                          </span>
                        </div>
              
                        {profile?.subscription_status === "trialing" && profile?.trial_ends_at && (
                          <div className="mt-0.5 text-[10px] text-amber-600">
                            Trial ends on {formatPlanDate(profile.trial_ends_at)}
                          </div>
                        )}
              
                        {hasPaidPlan &&
                          profile?.subscription_cancel_at_period_end &&
                          profile?.plan_ends_at && (
                            <div className="mt-0.5 text-[10px] text-orange-600">
                              Cancels on {formatPlanDate(profile.plan_ends_at)}
                            </div>
                          )}
              
                        {hasPaidPlan &&
                          !profile?.subscription_cancel_at_period_end &&
                          profile?.plan_ends_at && (
                            <div
                              className={cn(
                                "mt-0.5 text-[10px]",
                                theme === "dark" ? "text-slate-400" : "text-slate-500"
                              )}
                            >
                              Active until {formatPlanDate(profile.plan_ends_at)}
                            </div>
                          )}
              
                        {!hasPaidPlan && canShowTrialEntry && (
                          <div className="mt-1 text-[10px] leading-4 text-blue-600">
                            7-day Premium trial available
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
              
                  {showBillingActions && (
                    <div className="mt-2 flex flex-col gap-1.5">
                      <button
                        onClick={() => setShowPlansModal(true)}
                        className={cn(
                          "w-full rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition",
                          theme === "dark"
                            ? "border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700"
                            : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                        )}
                      >
                        See Plans
                      </button>
              
                      {hasPaidPlan && (
                        <>
                          <button
                            onClick={handleManageSubscription}
                            disabled={isBillingLoading}
                            className={cn(
                              "w-full rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-70",
                              theme === "dark"
                                ? "border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700"
                                : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                            )}
                          >
                            {isBillingLoading ? "Please wait..." : "Manage Subscription"}
                          </button>
              
                          <button
                            onClick={handleCancelSubscription}
                            disabled={isBillingLoading}
                            className={cn(
                              "w-full rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-70",
                              theme === "dark"
                                ? "border-rose-900 bg-rose-950/40 text-rose-300 hover:bg-rose-950/60"
                                : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                            )}
                          >
                            {isBillingLoading ? "Please wait..." : "Cancel Subscription"}
                          </button>
                        </>
                      )}
                    </div>
                  )}
              
                  <div
                    className={cn(
                      "mt-1 text-[9px] leading-3.5",
                      theme === "dark" ? "text-slate-400" : "text-slate-500"
                    )}
                  >
                    Free includes Mock Test. Upgrade only when you need higher limits.
                  </div>
                </div>
              )
            }
          />
        }
        rightPanel={desktopStudyPanel}
      >
        {/* Main Content */}
        <main className="min-w-0 h-full overflow-hidden">
          
          {!activeId ? (
            <div className="h-full flex flex-col p-2 sm:p-3 lg:p-4">
              <div
                className={cn(
                  "flex-1 min-h-0 rounded-[28px] border shadow-sm overflow-hidden transition-colors duration-300",
                  theme === "dark"
                    ? "bg-slate-900 border-slate-800"
                    : "bg-white border-slate-200"
                )}
              >
                <div
                  className={cn(
                    "border-b px-4 py-3 sm:px-5",
                    theme === "dark" ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-white"
                  )}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleUploadButtonClick}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 px-3 py-2 text-sm font-medium text-white"
                      >
                        <Upload className="h-4 w-4" />
                        Upload
                      </button>

                      <label
                        className={cn(
                          "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                          theme === "dark"
                            ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        <Camera className="h-4 w-4" />
                        Camera
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleCameraUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="relative sm:ml-auto sm:min-w-[280px] sm:flex-1 sm:max-w-[440px]">
                      <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        ref={urlInputRef}
                        type="text"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleUrlAnalyze(e.currentTarget.value);
                          }
                        }}
                        placeholder="Paste YouTube or website URL"
                        className={cn(
                          "w-full rounded-xl border pl-10 pr-20 py-2.5 text-sm outline-none transition-colors",
                          theme === "dark"
                            ? "border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-400"
                            : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => handleUrlAnalyze(urlInput)}
                        disabled={!urlInput.trim()}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        Analyze
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    "flex flex-1 min-h-0 flex-col justify-center px-6 text-center",
                    theme === "dark" ? "bg-slate-900" : "bg-white"
                  )}
                >
                  <div className="mx-auto max-w-xl">
                    <div className="mb-4 inline-flex rounded-2xl bg-gradient-to-br from-blue-600/20 to-teal-500/20 p-3">
                      <MessageSquare className="h-7 w-7 text-blue-500" />
                    </div>
                    <h2 className={cn("text-xl font-semibold", theme === "dark" ? "text-slate-100" : "text-slate-900")}>
                      Your chat workspace is ready
                    </h2>
                    <p className={cn("mt-2 text-sm", theme === "dark" ? "text-slate-400" : "text-slate-600")}>
                      Upload a document, screenshot, or URL to start a grounded conversation in the center panel.
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    "border-t px-4 py-3 sm:px-5",
                    theme === "dark" ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"
                  )}
                >
                  <div className="flex items-end gap-2">
                    <div className="relative flex-1">
                      <textarea
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Upload a document to start chatting..."
                        disabled
                        className={cn(
                          "w-full min-h-[62px] max-h-44 resize-none overflow-y-auto rounded-3xl px-5 py-4 pr-14 text-[15px] outline-none transition-all",
                          theme === "dark"
                            ? "bg-slate-800/90 text-slate-300 placeholder:text-slate-500"
                            : "bg-slate-100 text-slate-600 placeholder:text-slate-500"
                        )}
                        rows={1}
                      />
                      <button
                        disabled
                        className="absolute right-3 bottom-3 rounded-full bg-slate-400/40 p-2 text-slate-300"
                      >
                        <Mic className="h-5 w-5" />
                      </button>
                    </div>
                    <button
                      disabled
                      className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-teal-600 text-white opacity-50"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (


            /* Document Loaded - Show Tabs and Content */
            <div className="h-full flex flex-col p-2 sm:p-3 lg:p-4">
              {/* Tabs */}
              <div className="mb-4 lg:hidden">
                <div
                  className={cn(
                    "flex w-full overflow-x-auto gap-2 p-1.5 rounded-2xl border shadow-sm scrollbar-thin transition-colors duration-300",
                    theme === "dark"
                      ? "bg-slate-900 border-slate-800"
                      : "bg-white border-slate-200"
                  )}
                >
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200 shrink-0",
                        activeTab === tab.id
                          ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-lg shadow-blue-500/25"
                          : theme === "dark"
                          ? "text-slate-300 hover:text-white hover:bg-slate-800"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"

                      )}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>



              {/* Tab Content */}
              <div
                className={cn(
                  "flex-1 min-h-0 rounded-[28px] border shadow-sm overflow-hidden transition-colors duration-300",
                  theme === "dark"
                    ? "bg-slate-900 border-slate-800"
                    : "bg-white border-slate-200"
                )}
              >
                {/* Chat Tab */}
                {(activeId || activeTab === "chat") && (
                  <div
                    className={cn(
                      "h-full min-h-0 flex-col bg-white",
                      activeTab === "chat" ? "flex" : "hidden lg:flex"
                    )}
                  >

                    <div
                      className={cn(
                        "flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5",
                        theme === "dark"
                          ? "border-slate-800 bg-slate-900"
                          : "border-slate-100 bg-white"
                      )}
                    >


                      <div className="flex items-center gap-2">
                        <select
                          value={chatLanguage}
                          onChange={(e) => handleLanguageChange(e.target.value, "chat")}
                          className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 outline-none"
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
                          onClick={() => handleTranslate("chat")}
                          className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                        >
                          Translate
                        </button>
                      </div>
                    </div>

                    {/* Chat Messages */}

                    <div
                      className={cn(
                        "flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 space-y-5",
                        theme === "dark" ? "bg-slate-900" : "bg-white"
                      )}
                    >
                      {chatHistory.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                          <div className="p-4 bg-gradient-to-br from-blue-100 to-teal-100 rounded-2xl mb-4">
                            <MessageSquare className="w-8 h-8 text-blue-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Chat with your document
                          </h3>
                          <p className="text-gray-500 max-w-sm">
                            Ask questions, request explanations, or explore topics from your uploaded material.
                          </p>
                        </div>
                      )}

                      {chatHistory.map((message, index) => (
                        <div
                          key={index}
                          className={cn(
                            "flex",
                            message.role === "user" ? "justify-end" : "justify-start"
                          )}
                        >

                          <div
                            className={cn(
                              "max-w-[96%] sm:max-w-[88%] lg:max-w-[78%] px-4 py-3 rounded-2xl",
                              message.role === "user"
                                ? "bg-gradient-to-r from-blue-600 to-teal-600 !text-white rounded-br-md shadow-sm"
                                : theme === "dark"
                                ? "bg-transparent text-slate-100"
                                : "bg-transparent text-slate-900"
                            )}
                          >

                            {message.role === "assistant" ? (

                              <div
                                className={cn(
                                  "prose prose-sm max-w-none prose-p:my-2 prose-headings:my-2",
                                  theme === "dark"
                                    ? "prose-headings:!text-slate-100 prose-p:!text-slate-300 prose-strong:!text-slate-100 prose-li:!text-slate-300 prose-a:!text-blue-300"
                                    : "prose-headings:text-slate-900 prose-p:text-slate-700 prose-strong:text-slate-900 prose-li:text-slate-700"
                                )}
                              >

                                <ReactMarkdown>{message.content}</ReactMarkdown>
                              </div>


                            ) : (

                              <p className={cn("whitespace-pre-wrap", message.role === "user" ? "!text-white" : theme === "dark" ? "text-slate-100" : "text-slate-900")}>
                                {message.content}
                              </p>

                            )}

                            {message.role === "assistant" && message.content && (
                              <button
                                onClick={() => handleSpeakChat(index, message.content)}
                                className="mt-2 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              >

                                {loadingChatAudioId === `${activeId}-${index}` ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : activeAudioId === `${activeId}-${index}` ? (
                                  <VolumeX className="w-4 h-4" />
                                ) : (
                                  <Volume2 className="w-4 h-4" />
                                )}

                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Loading Indicator */}
                      {isAsking && (

                        <div className="flex justify-start">
                          <div className="px-4 py-3 text-slate-700">
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                              <span className="text-slate-600 text-sm">Thinking...</span>
                            </div>
                          </div>
                        </div>

                      )}

                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}

                    <div
                      className={cn(
                        "border-t px-4 py-3 sm:px-5",
                        theme === "dark"
                          ? "border-slate-800 bg-slate-900"
                          : "border-slate-200 bg-white"
                      )}
                    >

                      <div className="flex items-end gap-2">
                        <div className="flex-1 relative">



                          <textarea
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onInput={(e) => {
                              const el = e.currentTarget;
                              el.style.height = "auto";
                              el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleAsk("chat");
                              }
                            }}
                            placeholder="Ask anything about your document..."
                            className={cn(
                              "w-full min-h-[62px] max-h-44 resize-none overflow-y-auto rounded-3xl px-5 py-4 pr-14 text-[15px] outline-none transition-all",
                              theme === "dark"
                                ? "bg-slate-800/90 !text-white caret-white placeholder:!text-slate-400"
                                : "bg-slate-100 !text-slate-900 caret-slate-900 placeholder:!text-slate-500"
                            )}
                            rows={1}
                          />


                          <button
                            onClick={handleVoiceInput}
                            className={cn(
                              "absolute right-4 bottom-4 p-1.5 rounded-full transition-colors",
                              isListening
                                ? "bg-red-100 text-red-600"
                                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            )}
                          >
                            <Mic className="w-5 h-5" />
                          </button>
                        </div>
                        {isStreaming ? (
                          <button
                            onClick={handleStopAnswer}
                            className="h-12 w-12 rounded-full bg-red-500 text-white hover:bg-red-600 shadow-lg transition-all flex items-center justify-center"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAsk("chat")}
                            disabled={!question.trim() || isAsking}
                            className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-teal-600 text-white hover:from-blue-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center"
                          >
                            <Send className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}





                {/* Summary Tab */}
                {activeTab === "summary" && (

                  <div
                    className={cn(
                      "flex h-full min-h-0 flex-col lg:hidden",
                      theme === "dark" ? "bg-slate-900" : "bg-white"
                    )}
                  >

                    {isTabLoading ? (

                      <div
                        className={cn(
                          "flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5",
                          theme === "dark"
                            ? "border-slate-800 bg-slate-900"
                            : "border-slate-100 bg-white"
                        )}
                      >
                      </div>
                    ) : (
                      <>

                        <div
                          className={cn(
                            "flex items-center justify-between gap-1 border-b px-4 py-4 sm:px-5 sm:py-3",
                            theme === "dark"
                              ? "border-slate-800 bg-slate-900"
                              : "border-slate-100 bg-white"
                          )}
                        >


                          <div className="flex items-center gap-2">
                            <select
                              value={chatLanguage}
                              onChange={(e) => handleLanguageChange(e.target.value, "tab")}
                              className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 outline-none"

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
                              onClick={() => handleTranslate("tab")}
                              className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                            >
                              Translate
                            </button>
                        
                          </div>



                          <div className="flex flex-col items-end gap-1">
                            <button
                              onClick={handleSpeakTab}
                              disabled={isAudioLoading}
                              className={cn(
                                "p-2 rounded-xl transition-colors flex items-center gap-2",
                                isAudioLoading
                                  ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                                  : isTabSpeaking
                                    ? "bg-blue-100 text-blue-600"
                                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                              )}
                            >
                              {isAudioLoading ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span className="text-sm">Processing...</span>
                                </>
                              ) : isTabSpeaking ? (
                                <VolumeX className="w-5 h-5" />
                              ) : (
                                <Volume2 className="w-5 h-5" />
                              )}
                            </button>

                            {audioLimitMessage && (
                              <div className="max-w-[240px] text-right text-[11px] leading-4 text-rose-600">
                                {audioLimitMessage}
                              </div>
                            )}
                          </div>
                       
                        </div>

                        <div
                          className={cn(
                            "flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5",
                            theme === "dark" ? "bg-slate-900" : "bg-white"
                          )}
                        >
                          <div
                            className={cn(
                              "prose prose-sm sm:prose max-w-none leading-7 prose-headings:mb-3 prose-strong:font-semibold prose-li:my-1 prose-p:my-3",
                              theme === "dark"
                                ? "prose-headings:text-slate-100 prose-p:text-slate-300 prose-strong:text-slate-100 prose-li:text-slate-300"
                                : "prose-headings:text-slate-900 prose-p:text-slate-700 prose-strong:text-slate-900 prose-li:text-slate-700"
                            )}
                          >
                            <ReactMarkdown>{cleanContent}</ReactMarkdown>
                          </div>
                        </div>


                      </>
                    )}
                  </div>
                )}

                {/* Concepts Tab */}
                {activeTab === "concepts" && (


                  <div
                    className={cn(
                      "flex h-full min-h-0 flex-col lg:hidden",
                      theme === "dark" ? "bg-slate-900" : "bg-white"
                    )}
                  >

                    {isTabLoading ? (

                      <div
                        className={cn(
                          "flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5",
                          theme === "dark"
                            ? "border-slate-800 bg-slate-900"
                            : "border-slate-100 bg-white"
                        )}
                      >
                      </div>
                    ) : (
                      <>

                        <div
                          className={cn(
                            "flex items-center justify-between gap-1 border-b px-4 py-4 sm:px-5 sm:py-3",
                            theme === "dark"
                              ? "border-slate-800 bg-slate-900"
                              : "border-slate-100 bg-white"
                          )}
                        >

                          <div className="flex items-center gap-2">
                            <select
                              value={chatLanguage}
                              onChange={(e) => handleLanguageChange(e.target.value, "tab")}
                              className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 outline-none"

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
                              onClick={() => handleTranslate("tab")}
                              className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                            >
                              Translate
                            </button>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <button
                              onClick={handleSpeakTab}
                              disabled={isAudioLoading}
                              className={cn(
                                "p-2 rounded-xl transition-colors flex items-center gap-2",
                                isAudioLoading
                                  ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                                  : isTabSpeaking
                                    ? "bg-blue-100 text-blue-600"
                                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                              )}
                            >
                              {isAudioLoading ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span className="text-sm">Processing...</span>
                                </>
                              ) : isTabSpeaking ? (
                                <VolumeX className="w-5 h-5" />
                              ) : (
                                <Volume2 className="w-5 h-5" />
                              )}
                            </button>

                            {audioLimitMessage && (
                              <div className="max-w-[240px] text-right text-[11px] leading-4 text-rose-600">
                                {audioLimitMessage}
                              </div>
                            )}
                          </div>

                        </div>

                        <div
                          className={cn(
                            "flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5",
                            theme === "dark" ? "bg-slate-900" : "bg-white"
                          )}
                        >
                          <div
                            className={cn(
                              "prose prose-sm sm:prose max-w-none leading-7 prose-headings:mb-3 prose-strong:font-semibold prose-li:my-1 prose-p:my-3",
                              theme === "dark"
                                ? "prose-headings:text-slate-100 prose-p:text-slate-300 prose-strong:text-slate-100 prose-li:text-slate-300"
                                : "prose-headings:text-slate-900 prose-p:text-slate-700 prose-strong:text-slate-900 prose-li:text-slate-700"
                            )}
                          >
                            <ReactMarkdown>{translatedTabContent || tabContent}</ReactMarkdown>
                          </div>
                        </div>

                      </>
                    )}
                  </div>
                )}


                {/* Practice Tab */}
                {activeTab === "practice" && (
                  <div
                    className={cn(
                      "flex h-full min-h-0 flex-col lg:hidden",
                      theme === "dark" ? "bg-slate-900" : "bg-white"
                    )}
                  >

                    {isTabLoading ? (

                      <div
                        className={cn(
                          "flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5",
                          theme === "dark"
                            ? "border-slate-800 bg-slate-900"
                            : "border-slate-100 bg-white"
                        )}
                      >
                      </div>
                    ) : (
                      <>

                        <div
                          className={cn(
                            "flex items-center justify-between gap-1 border-b px-4 py-4 sm:px-5 sm:py-3",
                            theme === "dark"
                              ? "border-slate-800 bg-slate-900"
                              : "border-slate-100 bg-white"
                          )}
                        >


                          <div className="flex items-center gap-2">
                            <select
                              value={chatLanguage}
                              onChange={(e) => handleLanguageChange(e.target.value, "tab")}
                              className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 outline-none"

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
                              onClick={() => handleTranslate("tab")}
                              className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                            >
                              Translate
                            </button>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <button
                              onClick={handleSpeakTab}
                              disabled={isAudioLoading}
                              className={cn(
                                "p-2 rounded-xl transition-colors flex items-center gap-2",
                                isAudioLoading
                                  ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                                  : isTabSpeaking
                                  ? "bg-blue-100 text-blue-600"
                                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                              )}
                            >
                              {isAudioLoading ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span className="text-sm">Processing...</span>
                                </>
                              ) : isTabSpeaking ? (
                                <VolumeX className="h-5 w-5" />
                              ) : (
                                <Volume2 className="h-5 w-5" />
                              )}
                            </button>

                            {audioLimitMessage && (
                              <div className="max-w-[240px] text-right text-[11px] leading-4 text-rose-600">
                                {audioLimitMessage}
                              </div>
                            )}
                          </div>
                        </div>

                        <div
                          className={cn(
                            "flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5",
                            theme === "dark" ? "bg-slate-900" : "bg-white"
                          )}
                        >
                          <div
                            className={cn(
                              "prose prose-sm sm:prose max-w-none leading-8 prose-headings:mb-4 prose-strong:font-semibold prose-li:my-3 prose-p:my-4",
                              theme === "dark"
                                ? "prose-headings:text-slate-100 prose-p:text-slate-300 prose-strong:text-slate-100 prose-li:text-slate-300"
                                : "prose-headings:text-slate-900 prose-p:text-slate-700 prose-strong:text-slate-900 prose-li:text-slate-700"
                            )}
                          >
                            <ReactMarkdown>{cleanContent}</ReactMarkdown>
                          </div>
                        </div>
                      </>
                    )}


                  </div>
                )}


                {/* Mock Test Tab */}
                {activeTab === "mock" && (

                  <div
                    className={cn(
                      "h-full min-h-0 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4 lg:hidden",
                      theme === "dark" ? "bg-slate-900" : "bg-white"
                    )}
                  >

                    <div className="flex items-center justify-center gap-2 pb-3 pt-1">

                      {[
                        { value: "easy", label: "Easy" },
                        { value: "medium", label: "Medium" },
                        { value: "hard", label: "Hard" },
                      ]
                        .filter((level) => allowedMockDifficulties.includes(level.value))
                        .map((level) => (


                        <button
                          key={level.value}

                          onClick={() => {
                            const nextDifficulty = level.value as "easy" | "medium" | "hard";
                            setMockDifficulty(nextDifficulty);
                            setQuizAnswers({});
                            setQuizScore(null);
                            setCurrentQ(0);
                            setTranslatedTabContent("");
                            handleTabClick("mock", nextDifficulty);
                          }}

                          className={cn(
                            "px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all",
                            mockDifficulty === level.value
                              ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white border-transparent shadow-md"
                              : theme === "dark"
                                ? "bg-slate-900 text-slate-100 border-slate-700 hover:bg-slate-800"
                                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"

                          )}
                        >
                          {level.label}
                        </button>
                      ))}
                    </div>

                    {isTabLoading ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                        <p className={theme === "dark" ? "text-slate-300" : "text-gray-600"}>
                          Generating mock test...
                        </p>
                      </div>
                    ) : quizData.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="p-4 bg-gradient-to-br from-blue-100 to-teal-100 rounded-2xl mb-4">
                          <Award className="w-8 h-8 text-blue-600" />
                        </div>

                        <h3 className={cn("text-lg font-semibold mb-2", theme === "dark" ? "text-slate-100" : "text-gray-900")}>
                          No quiz available
                        </h3>

                        <p className={cn("mb-6 max-w-sm text-center", theme === "dark" ? "text-slate-400" : "text-gray-500")}>
                          Click the Mock Test tab to generate a quiz from your document.
                        </p>
                      </div>
                    ) : quizScore !== null ? (
                      /* Results View */
                      <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-6">
                          <div
                            className={cn(
                              "inline-flex p-4 rounded-2xl mb-4",
                              quizScore >= quizData.length * 0.7
                                ? "bg-green-100"
                                : quizScore >= quizData.length * 0.5
                                ? "bg-amber-100"
                                : "bg-red-100"
                            )}
                          >
                            <Award
                              className={cn(
                                "w-10 h-10",
                                quizScore >= quizData.length * 0.7
                                  ? "text-green-600"
                                  : quizScore >= quizData.length * 0.5
                                  ? "text-amber-600"
                                  : "text-red-600"
                              )}
                            />
                          </div>

                          <h2 className={cn("text-2xl font-bold mb-2", theme === "dark" ? "text-slate-100" : "text-gray-900")}>
                            Test Complete!
                          </h2>

                          <p className={cn("text-4xl font-bold", theme === "dark" ? "text-slate-100" : "text-gray-900")}>
                            {quizScore} / {quizData.length}
                          </p>
                          <p className={cn("mt-1", theme === "dark" ? "text-slate-400" : "text-gray-500")}>
                            {Math.round((quizScore / quizData.length) * 100)}% Correct
                          </p>
                        </div>

                        {/* Progress Bar */}
                        <div className={cn("h-3 rounded-full mb-6 overflow-hidden", theme === "dark" ? "bg-slate-800" : "bg-gray-100")}>
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              quizScore >= quizData.length * 0.7
                                ? "bg-green-500"
                                : quizScore >= quizData.length * 0.5
                                ? "bg-amber-500"
                                : "bg-red-500"
                            )}
                            style={{ width: `${(quizScore / quizData.length) * 100}%` }}
                          />
                        </div>

                        {/* Question Review */}
                        <div className="space-y-3 mb-6">
                          {quizData.map((q, idx) => {
                            const selectedIdx = parseInt(quizAnswers[idx] || "-1", 10);
                            const isCorrect = selectedIdx === q.correctAnswer;
                            return (
                              <div
                                key={idx}
                                className={cn(
                                  "p-4 rounded-xl border-2",

                                  isCorrect
                                    ? theme === "dark"
                                      ? "border-green-800 bg-green-950/40"
                                      : "border-green-200 bg-green-50"
                                    : theme === "dark"
                                      ? "border-red-800 bg-red-950/40"
                                      : "border-red-200 bg-red-50"

                                )}
                              >
                                <div className="flex items-start gap-3">
                                  {isCorrect ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                  )}
                                  <div className="flex-1">
                                    <p className={cn("font-medium mb-2", theme === "dark" ? "text-slate-100" : "text-gray-900")}>
                                      {idx + 1}. {q.question}
                                    </p>
                                    <p className={cn("text-sm", theme === "dark" ? "text-slate-300" : "text-gray-600")}>
                                      <span className="font-medium">Correct answer:</span>{" "}
                                      {q.options[q.correctAnswer]}
                                    </p>
                                    {!isCorrect && (
                                      <p className={cn("text-sm mt-1", theme === "dark" ? "text-red-300" : "text-red-600")}>
                                        <span className="font-medium">Your answer:</span>{" "}
                                        {selectedIdx >= 0 ? q.options[selectedIdx] : "Not answered"}
                                      </p>
                                    )}
                                    {q.explanation && (

                                      <p className={cn("text-sm mt-2 italic", theme === "dark" ? "text-slate-400" : "text-gray-500")}>
                                        {q.explanation}
                                      </p>

                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => {
                            setQuizScore(null);
                            setQuizAnswers({});
                            setCurrentQ(0);
                          }}
                          className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-teal-700 shadow-lg transition-all"
                        >
                          Retake Test
                        </button>
                      </div>
                    ) : (
                      /* Question View */
                      <div className="max-w-2xl mx-auto">
                        {/* Progress */}
                        <div className="flex items-center justify-between mb-4">
                          <span className={cn("text-sm", theme === "dark" ? "text-slate-400" : "text-gray-500")}>
                            Question {currentQ + 1} of {quizData.length}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className={cn("h-2 rounded-full mb-5 overflow-hidden", theme === "dark" ? "bg-slate-800" : "bg-gray-100")}>
                          <div
                            className="h-full bg-gradient-to-r from-blue-600 to-teal-600 rounded-full transition-all duration-300"
                            style={{ width: `${((currentQ + 1) / quizData.length) * 100}%` }}
                          />
                        </div>

                        {/* Question */}
                        <div className="mb-8">
                          <h3 className={cn("text-base sm:text-lg font-semibold mb-4", theme === "dark" ? "text-slate-100" : "text-gray-900")}>
                            {quizData[currentQ]?.question}
                          </h3>

                          <div className="space-y-2.5">
                            {quizData[currentQ]?.options.map((option: string, idx: number) => (
                              <button
                                key={idx}
                                onClick={() => setQuizAnswers({ ...quizAnswers, [currentQ]: String(idx) })}
                                className={cn(
                                  "w-full text-left p-3.5 rounded-xl border-2 transition-all duration-200",

                                  quizAnswers[currentQ] === String(idx)
                                    ? theme === "dark"
                                      ? "border-blue-500 bg-blue-950/40"
                                      : "border-blue-500 bg-blue-50"
                                    : theme === "dark"
                                      ? "border-slate-700 bg-slate-900 hover:border-slate-600 hover:bg-slate-800"
                                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"

                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={cn(
                                      "w-6 h-6 rounded-full border-2 flex items-center justify-center",

                                      quizAnswers[currentQ] === String(idx)
                                        ? "border-blue-500 bg-blue-500"
                                        : theme === "dark"
                                          ? "border-slate-600"
                                          : "border-gray-300"

                                    )}
                                  >
                                    {quizAnswers[currentQ] === String(idx) && (
                                      <div className="w-2 h-2 bg-white rounded-full" />
                                    )}
                                  </div>
                                  <span className={theme === "dark" ? "text-slate-100" : "text-gray-900"}>{option}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Navigation */}

                        <div
                          className={cn(
                            "sticky bottom-0 flex items-center justify-between gap-3 pt-4",
                            theme === "dark" ? "bg-slate-900" : "bg-white"
                          )}
                        >
                          <button
                            onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
                            disabled={currentQ === 0}

                            className={cn(
                              "flex items-center gap-1 px-4 py-2 font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
                              theme === "dark"
                                ? "text-slate-300 hover:bg-slate-800"
                                : "text-gray-600 hover:bg-gray-100"
                            )}

                          >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                          </button>

                          {currentQ === quizData.length - 1 ? (
                            <button
                              onClick={handleQuizSubmit}
                              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-teal-700 shadow-lg transition-all"
                            >
                              Finish Test
                            </button>
                          ) : (
                            <button
                              onClick={() => setCurrentQ(Math.min(quizData.length - 1, currentQ + 1))}
                              className="flex items-center gap-1 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-teal-700 shadow-lg transition-all"
                            >
                              Next
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}




              </div>
            </div>
          )}
        </main>
      </WorkspaceShell>

      {/* Hidden File Input */}
      <input
        id="fileUpload"
        type="file"
        accept=".pdf,.doc,.docx,.txt,.md,.sas"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Loading Overlay */}
      {isUploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600 font-medium">Processing your document...</p>
          </div>
        </div>
      )}
    </div>
  );
}
