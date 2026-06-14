"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, X, Loader2, Sparkles, Bot,
  User, Trash2, BarChart3, Languages, Lightbulb,
  Camera, History as HistoryIcon, MessageSquare
} from "lucide-react";
import {
  getCurrentSession, createChatSession, saveMessages,
  getChatSessions, deleteChatSession,
  type ChatMessage, type ChatSession
} from "@/lib/chatHistory";
import { ImageSearchModal } from "./ImageSearchModal";

interface UserContext {
  watchHistory?: any[];
  favorites?: any[];
  mangaHistory?: any[];
  currentPage?: { title: string; type?: string; genres?: string };
}

const QUICK_ACTIONS = [
  { label: "💬 Ngobrol", action: "chat", icon: Sparkles },
  { label: "🎯 Rekomendasi", action: "recommend", icon: Lightbulb },
  { label: "📊 Analisis", action: "analyze", icon: BarChart3 },
];

const SUGGESTIONS = [
  "Rekomendasikan anime action terbaik",
  "Anime mirip Attack on Titan",
  "Aku udah nonton apa aja?",
  "Manga apa yang udah aku baca?",
  "Anime yang bikin nangis",
];

// ─── RAG: Collect user data from localStorage ────

function getUserContext(): UserContext {
  if (typeof window === "undefined") return {};
  const ctx: UserContext = {};

  try {
    const raw = localStorage.getItem("aniverse_watch_history");
    if (raw) ctx.watchHistory = JSON.parse(raw).slice(0, 20);
  } catch {}

  try {
    const raw = localStorage.getItem("aniverse_my_list");
    if (raw) ctx.favorites = JSON.parse(raw).slice(0, 15);
  } catch {}

  try {
    const raw = localStorage.getItem("aniverse_manga_history");
    if (raw) ctx.mangaHistory = JSON.parse(raw).slice(0, 15);
  } catch {}

  return ctx;
}

export function AIChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "recommend" | "analyze">("chat");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hide on chapter reader pages
  const isReaderPage = pathname?.includes("/manga/chapter/");

  // Auto-scroll
  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  // Load or create session on open
  useEffect(() => {
    if (isOpen && !sessionId) {
      const existing = getCurrentSession();
      if (existing && existing.messages.length > 0) {
        setSessionId(existing.id);
        setMessages(existing.messages);
      } else {
        const session = createChatSession();
        setSessionId(session.id);
        // Welcome message
        const ctx = getUserContext();
        const watchCount = ctx.watchHistory?.length || 0;
        const mangaCount = ctx.mangaHistory?.length || 0;

        let welcomeExtra = "";
        if (watchCount > 0 || mangaCount > 0) {
          const parts = [];
          if (watchCount > 0) parts.push(`${watchCount} anime`);
          if (mangaCount > 0) parts.push(`${mangaCount} manga`);
          welcomeExtra = `\n\nAku bisa lihat kamu sudah menonton/membaca **${parts.join(" & ")}** 🎬📖. Tanya aku tentang riwayat, minta rekomendasi, atau analisis profil kamu!`;
        }

        const welcome: ChatMessage = {
          id: "welcome",
          role: "model",
          text: `Halo! 👋 Aku **AniBot**, asisten AI anime kamu.\n\nAku bisa:\n• 💬 Ngobrol tentang anime & manga\n• 🎯 Rekomendasi personal\n• 📊 Analisis profil tontonan\n• 📷 Identifikasi anime dari gambar\n• 🌐 Terjemahkan sinopsis${welcomeExtra}`,
          timestamp: Date.now(),
        };
        setMessages([welcome]);
        saveMessages(session.id, [welcome]);
      }
    }
  }, [isOpen, sessionId]);

  // Save messages whenever they change
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      saveMessages(sessionId, messages);
    }
  }, [messages, sessionId]);

  // ─── API Call ──────────────────────────────

  const callAPI = useCallback(async (action: string, payload: Record<string, any>) => {
    setLoading(true);
    try {
      const userContext = getUserContext();
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload, userContext }),
      });
      const data = await res.json();
      return data.result || data.error || "Maaf, ada kesalahan. Coba lagi ya!";
    } catch {
      return "⚠️ Gagal menghubungi AI. Periksa koneksi internet kamu.";
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Send Chat Message ─────────────────────

  const sendMessage = useCallback(async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", text: msg, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    const history = messages
      .filter(m => m.id !== "welcome")
      .map(m => ({ role: m.role, text: m.text }));

    const result = await callAPI("chat", { message: msg, history });
    setMessages(prev => [...prev, { id: `b-${Date.now()}`, role: "model", text: result, timestamp: Date.now() }]);
    if (!isOpen) setHasUnread(true);
  }, [input, loading, messages, isOpen, callAPI]);

  // ─── Quick Actions ─────────────────────────

  const runAction = useCallback(async (action: string, label: string) => {
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", text: label, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    const result = await callAPI(action, {});
    setMessages(prev => [...prev, { id: `b-${Date.now()}`, role: "model", text: result, timestamp: Date.now() }]);
  }, [callAPI]);

  // ─── Chat History Management ───────────────

  const startNewChat = useCallback(() => {
    const session = createChatSession();
    setSessionId(session.id);
    setMessages([]);
    setShowHistory(false);
  }, []);

  const loadSession = useCallback((session: ChatSession) => {
    setSessionId(session.id);
    setMessages(session.messages);
    setShowHistory(false);
  }, []);

  const clearChat = useCallback(() => {
    if (sessionId) deleteChatSession(sessionId);
    const session = createChatSession();
    setSessionId(session.id);
    setMessages([]);
  }, [sessionId]);

  if (isReaderPage) return null;

  return (
    <>
      {/* Image Search Modal */}
      <ImageSearchModal isOpen={showImageSearch} onClose={() => setShowImageSearch(false)} />

      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => { setIsOpen(true); setHasUnread(false); }}
            className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/30 flex items-center justify-center hover:shadow-purple-500/50 hover:scale-105 transition-all"
          >
            <Sparkles size={24} />
            {hasUnread && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">!</span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[400px] z-50 max-h-[85vh] flex flex-col rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] shadow-2xl shadow-black/40 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-[var(--color-border)]">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
                <Bot size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold">AniBot</h3>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-[10px] text-[var(--color-text-muted)]">Gemini AI • Mengenal riwayat kamu</p>
                </div>
              </div>
              <button onClick={() => setShowHistory(!showHistory)} className="p-1.5 rounded-full hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-purple-400 transition-colors" title="Riwayat chat">
                <HistoryIcon size={14} />
              </button>
              <button onClick={clearChat} className="p-1.5 rounded-full hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-red-400 transition-colors" title="Hapus chat">
                <Trash2 size={14} />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-full hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Chat History Panel (overlay) */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 overflow-hidden"
                >
                  <div className="p-3 space-y-1.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-[var(--color-text-muted)]">RIWAYAT CHAT</span>
                      <button onClick={startNewChat} className="text-[10px] font-semibold text-purple-400 hover:text-purple-300">
                        + Chat Baru
                      </button>
                    </div>
                    {getChatSessions().map(s => (
                      <button
                        key={s.id}
                        onClick={() => loadSession(s)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-[11px] transition-all flex items-center gap-2 ${
                          s.id === sessionId
                            ? "bg-purple-500/15 text-purple-400 border border-purple-500/20"
                            : "hover:bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]"
                        }`}
                      >
                        <MessageSquare size={10} />
                        <span className="truncate flex-1">{s.title || "Chat tanpa judul"}</span>
                        <span className="text-[9px] text-[var(--color-text-muted)] shrink-0">{s.messages.length} msg</span>
                      </button>
                    ))}
                    {getChatSessions().length === 0 && (
                      <p className="text-[10px] text-[var(--color-text-muted)] text-center py-2">Belum ada riwayat</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Action Tabs */}
            <div className="flex gap-1 px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]/50">
              {QUICK_ACTIONS.map(qa => (
                <button
                  key={qa.action}
                  onClick={() => {
                    setActiveTab(qa.action as any);
                    if (qa.action === "recommend") runAction("recommend", "🎯 Berikan rekomendasi anime");
                    if (qa.action === "analyze") runAction("analyze", "📊 Analisis profil anime saya");
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-medium transition-all ${
                    activeTab === qa.action
                      ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                      : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] border border-transparent"
                  }`}
                >
                  <qa.icon size={11} />
                  {qa.label}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px] max-h-[50vh] scrollbar-thin">
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "model" && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot size={12} className="text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-blue-500 text-white rounded-br-sm"
                        : "bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-bl-sm"
                    }`}
                    dangerouslySetInnerHTML={{
                      __html: msg.text
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        .replace(/\n/g, "<br/>")
                    }}
                  />
                  {msg.role === "user" && (
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <User size={12} className="text-blue-400" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-2 items-start">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
                    <Bot size={12} className="text-white" />
                  </div>
                  <div className="bg-[var(--color-surface-2)] border border-[var(--color-border)] px-3 py-2.5 rounded-2xl rounded-bl-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:300ms]" />
                      </div>
                      <span className="text-[10px] text-[var(--color-text-muted)]">AniBot sedang berpikir...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Quick Suggestions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-[10px] px-2.5 py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-purple-500/40 hover:bg-purple-500/5 hover:text-purple-400 transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-[var(--color-border)]">
              <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowImageSearch(true)}
                  className="p-2 rounded-full hover:bg-pink-500/10 text-[var(--color-text-muted)] hover:text-pink-400 transition-colors shrink-0"
                  title="Image Search"
                >
                  <Camera size={16} />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Tanya tentang anime..."
                  className="flex-1 px-3.5 py-2 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl outline-none focus:border-purple-500/50 transition-colors"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white disabled:opacity-30 hover:shadow-lg hover:shadow-purple-500/20 transition-all shrink-0"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
