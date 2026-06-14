/**
 * AniBot Chat History Persistence
 * Stores chat sessions in localStorage for continuity.
 */

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  title?: string; // Auto-generated from first user message
}

const CHAT_KEY = "aniverse_chat_history";
const MAX_SESSIONS = 5;
const MAX_MESSAGES_PER_SESSION = 50;

// ─── Get all chat sessions ──────────────────────
export function getChatSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ─── Get current (most recent) session ──────────
export function getCurrentSession(): ChatSession | null {
  const sessions = getChatSessions();
  return sessions.length > 0 ? sessions[0] : null;
}

// ─── Create a new chat session ──────────────────
export function createChatSession(): ChatSession {
  const session: ChatSession = {
    id: `chat-${Date.now()}`,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const sessions = getChatSessions();
  sessions.unshift(session);

  // Keep max sessions
  const trimmed = sessions.slice(0, MAX_SESSIONS);
  localStorage.setItem(CHAT_KEY, JSON.stringify(trimmed));

  return session;
}

// ─── Save messages to current session ───────────
export function saveMessages(sessionId: string, messages: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    const sessions = getChatSessions();
    const idx = sessions.findIndex(s => s.id === sessionId);

    if (idx === -1) return;

    // Trim messages
    sessions[idx].messages = messages.slice(-MAX_MESSAGES_PER_SESSION);
    sessions[idx].updatedAt = Date.now();

    // Auto-generate title from first user message
    if (!sessions[idx].title) {
      const firstUserMsg = messages.find(m => m.role === "user" && m.id !== "welcome");
      if (firstUserMsg) {
        sessions[idx].title = firstUserMsg.text.slice(0, 50);
      }
    }

    localStorage.setItem(CHAT_KEY, JSON.stringify(sessions));
  } catch {
    // ignore
  }
}

// ─── Delete a session ───────────────────────────
export function deleteChatSession(sessionId: string): void {
  if (typeof window === "undefined") return;
  try {
    const sessions = getChatSessions();
    const filtered = sessions.filter(s => s.id !== sessionId);
    localStorage.setItem(CHAT_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}

// ─── Clear all chat history ─────────────────────
export function clearAllChatHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CHAT_KEY);
}
