import { NextRequest, NextResponse } from "next/server";

/**
 * Gemini AI API Route — Multi-purpose AI endpoint for AniVerse
 * 
 * Features:
 * - Multi-key fallback: Rotates between API keys when rate limited
 * - RAG context: Injects user's watch history, favorites, and current page context
 * - Actions: chat, recommend, translate, analyze, review
 */

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// ─── Multi-Key Fallback System ───────────────────────────
function getApiKeys(): string[] {
  const keys: string[] = [];
  // Primary key
  if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY);
  // Fallback keys (comma-separated or numbered)
  if (process.env.GEMINI_API_KEY_2) keys.push(process.env.GEMINI_API_KEY_2);
  if (process.env.GEMINI_API_KEY_3) keys.push(process.env.GEMINI_API_KEY_3);
  // Also support comma-separated format: GEMINI_API_KEYS=key1,key2,key3
  if (process.env.GEMINI_API_KEYS) {
    keys.push(...process.env.GEMINI_API_KEYS.split(",").map(k => k.trim()).filter(Boolean));
  }
  return [...new Set(keys)]; // Deduplicate
}

// ─── System Prompts ──────────────────────────────────────

const SYSTEM_PROMPT = `Kamu adalah AniBot, asisten AI untuk website AniVerse — platform tracker anime dan manga Indonesia.

Panduan:
- Jawab dalam Bahasa Indonesia yang natural dan santai
- Kamu ahli di bidang anime, manga, manhwa, dan manhua
- Bisa merekomendasikan anime/manga berdasarkan preferensi user
- Bisa menjelaskan plot, karakter, dan fakta menarik tentang anime/manga
- Jangan menjawab pertanyaan yang tidak berhubungan dengan anime/manga/acg culture
- Untuk pertanyaan non-anime, arahkan kembali ke topik anime/manga dengan ramah
- Gunakan emoji secukupnya untuk membuat percakapan lebih hidup
- Jawab secara ringkas (maksimal 3-4 paragraf) kecuali diminta detail
- Jika user bertanya tentang riwayat tontonannya, gunakan data RAG yang disediakan

Format jawaban:
- Gunakan **bold** untuk judul anime/manga
- Gunakan • untuk bullet points jika merekomendasikan beberapa judul
- Gunakan numbered list untuk ranking`;

function buildRAGContext(userContext?: UserContext): string {
  if (!userContext) return "";

  const parts: string[] = [];

  // Watch history RAG (with progress)
  if (userContext.watchHistory && userContext.watchHistory.length > 0) {
    parts.push("=== RIWAYAT TONTONAN ANIME USER ===");
    userContext.watchHistory.slice(0, 20).forEach((item, i) => {
      const date = new Date(item.timestamp).toLocaleDateString("id-ID");
      let line = `${i + 1}. ${item.animeTitle}${item.animeTitleEnglish ? ` (${item.animeTitleEnglish})` : ""} — Episode: ${item.episodeTitle}`;
      if (item.episodeNumber) line += ` (Ep ${item.episodeNumber}${item.totalEpisodes ? `/${item.totalEpisodes}` : ""})`;
      if (item.watchedSeconds && item.durationSeconds) {
        const pct = Math.round((item.watchedSeconds / item.durationSeconds) * 100);
        line += ` — Progress: ${pct}%`;
      }
      line += ` — Ditonton: ${date}`;
      parts.push(line);
    });
  }

  // Favorites / My List RAG  
  if (userContext.favorites && userContext.favorites.length > 0) {
    parts.push("\n=== ANIME FAVORIT / LIST USER ===");
    userContext.favorites.forEach((item, i) => {
      parts.push(`${i + 1}. ${item.title}${item.status ? ` [${item.status}]` : ""}${item.score ? ` Rating: ${item.score}/10` : ""}`);
    });
  }

  // Manga history RAG
  if (userContext.mangaHistory && userContext.mangaHistory.length > 0) {
    parts.push("\n=== RIWAYAT BACA MANGA USER ===");
    userContext.mangaHistory.slice(0, 15).forEach((item: any, i: number) => {
      const date = new Date(item.timestamp).toLocaleDateString("id-ID");
      let line = `${i + 1}. ${item.mangaTitle} — Chapter: ${item.lastChapterTitle}`;
      if (item.type) line += ` [${item.type}]`;
      line += ` — Dibaca: ${date}`;
      parts.push(line);
    });
  }

  // Current page context
  if (userContext.currentPage) {
    parts.push(`\n=== HALAMAN YANG SEDANG DIBUKA ===`);
    parts.push(`User sedang melihat: ${userContext.currentPage.title} (${userContext.currentPage.type || "anime"})`);
    if (userContext.currentPage.genres) {
      parts.push(`Genre: ${userContext.currentPage.genres}`);
    }
  }

  if (parts.length === 0) return "";

  return `\n\n--- DATA USER (RAG Context, gunakan untuk menjawab dengan lebih personal) ---\n${parts.join("\n")}\n--- END RAG ---\n`;
}

// ─── Types ───────────────────────────────────────────────

interface UserContext {
  watchHistory?: {
    animeTitle: string;
    animeTitleEnglish?: string;
    episodeTitle: string;
    episodeNumber?: number;
    totalEpisodes?: number;
    watchedSeconds?: number;
    durationSeconds?: number;
    timestamp: number;
  }[];
  favorites?: {
    title: string;
    status?: string;
    score?: number;
  }[];
  mangaHistory?: {
    mangaTitle: string;
    lastChapterTitle: string;
    type?: string;
    timestamp: number;
  }[];
  currentPage?: {
    title: string;
    type?: string;
    genres?: string;
  };
}

interface GeminiRequest {
  action: "chat" | "recommend" | "translate" | "analyze" | "review";
  message?: string;
  animeList?: string[];
  synopsis?: string;
  animeTitle?: string;
  history?: { role: "user" | "model"; text: string }[];
  userContext?: UserContext;
}

// ─── Gemini API Call with Fallback ───────────────────────

async function callGemini(prompt: string, systemInstruction?: string): Promise<string> {
  const keys = getApiKeys();
  if (keys.length === 0) {
    throw new Error("No Gemini API keys configured");
  }

  let lastError = "";

  // Try each key until one works
  for (const key of keys) {
    try {
      const body: any = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1500,
        },
      };

      if (systemInstruction) {
        body.systemInstruction = { parts: [{ text: systemInstruction }] };
      }

      const res = await fetch(`${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 429) {
        // Rate limited — try next key
        lastError = `Rate limited on key ...${key.slice(-6)}`;
        console.warn(`[AniBot] ${lastError}, trying next key...`);
        continue;
      }

      if (res.status === 403) {
        // Key invalid or quota exceeded — try next key
        lastError = `Key ...${key.slice(-6)} forbidden/quota exceeded`;
        console.warn(`[AniBot] ${lastError}, trying next key...`);
        continue;
      }

      if (!res.ok) {
        const error = await res.text();
        lastError = `Gemini API error: ${res.status}`;
        console.error(`[AniBot] ${lastError}:`, error);
        continue;
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;

      lastError = "Empty response from Gemini";
      continue;
    } catch (err: any) {
      lastError = err.message || "Network error";
      console.error(`[AniBot] Error with key ...${key.slice(-6)}:`, lastError);
      continue;
    }
  }

  throw new Error(`All API keys failed. Last error: ${lastError}`);
}

// ─── POST Handler ────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body: GeminiRequest = await request.json();

    if (!body.action) {
      return NextResponse.json({ error: "Missing 'action' field" }, { status: 400 });
    }

    // Build RAG context from user data
    const ragContext = buildRAGContext(body.userContext);

    let result: string;

    switch (body.action) {
      // ── Chat (with RAG) ──────────────────────
      case "chat": {
        if (!body.message?.trim()) {
          return NextResponse.json({ error: "Missing 'message'" }, { status: 400 });
        }

        let prompt = "";

        // Add conversation history
        if (body.history && body.history.length > 0) {
          const historyText = body.history
            .slice(-8) // Keep last 8 messages for context
            .map(h => `${h.role === "user" ? "User" : "AniBot"}: ${h.text}`)
            .join("\n");
          prompt += `Percakapan sebelumnya:\n${historyText}\n\n`;
        }

        // Inject RAG context
        prompt += ragContext;
        prompt += `User: ${body.message}\nAniBot:`;

        result = await callGemini(prompt, SYSTEM_PROMPT);
        break;
      }

      // ── Smart Recommendation (with RAG) ──────
      case "recommend": {
        // Use either provided list or RAG watch history
        const animeList = body.animeList || 
          body.userContext?.watchHistory?.map(h => h.animeTitle) || [];
        const favorites = body.userContext?.favorites?.map(f => f.title) || [];
        const combined = [...new Set([...animeList, ...favorites])].slice(0, 20);

        if (combined.length === 0) {
          return NextResponse.json({ error: "Tidak ada data anime untuk direkomendasikan. Tonton beberapa anime dulu!" }, { status: 400 });
        }

        const recPrompt = `Berdasarkan daftar anime yang sudah ditonton/difavoritkan user berikut:
${combined.map((a, i) => `${i + 1}. ${a}`).join("\n")}

Rekomendasikan 5-7 anime lain yang kemungkinan besar akan disukai user. 

Untuk setiap rekomendasi:
1. Sebutkan judul anime
2. Jelaskan alasannya secara singkat (1-2 kalimat), hubungkan dengan anime yang sudah ditonton
3. Sebutkan genre utamanya
4. Beri rating kepercayaan (🔥 Sangat cocok / ✨ Mungkin suka / 💡 Coba ini)

Format jawaban:
1. **Judul Anime** 🔥
   Genre: Action, Fantasy
   Karena kamu suka [X], kamu pasti akan suka ini karena [alasan].

Jangan rekomendasikan anime yang sudah ada di daftar user.`;

        result = await callGemini(recPrompt, SYSTEM_PROMPT);
        break;
      }

      // ── Synopsis Translator ──────────────────
      case "translate": {
        if (!body.synopsis?.trim()) {
          return NextResponse.json({ error: "Missing 'synopsis'" }, { status: 400 });
        }

        const transPrompt = `Terjemahkan sinopsis anime/manga berikut ke Bahasa Indonesia yang natural dan enak dibaca. Jaga nuansa dan tone aslinya. Jangan tambahkan informasi apapun selain terjemahan:

"${body.synopsis}"`;

        result = await callGemini(transPrompt, "Kamu adalah penerjemah profesional anime/manga. Terjemahkan secara akurat dan natural ke Bahasa Indonesia.");
        break;
      }

      // ── Watch Analysis ───────────────────────
      case "analyze": {
        const watchHistory = body.userContext?.watchHistory || [];
        const favorites = body.userContext?.favorites || [];

        if (watchHistory.length === 0 && favorites.length === 0) {
          return NextResponse.json({ error: "Belum ada data tontonan untuk dianalisis" }, { status: 400 });
        }

        const analyzePrompt = `Analisis profil anime user berdasarkan data berikut:

RIWAYAT TONTONAN (${watchHistory.length} anime):
${watchHistory.slice(0, 25).map((h, i) => `${i + 1}. ${h.animeTitle}`).join("\n")}

${favorites.length > 0 ? `FAVORIT (${favorites.length} anime):\n${favorites.slice(0, 15).map((f, i) => `${i + 1}. ${f.title}${f.score ? ` — Rating: ${f.score}/10` : ""}`).join("\n")}` : ""}

Berikan analisis dalam format berikut:
1. **🎭 Profil Kamu**: Tipe penonton apa user ini (casual, hardcore, genre-specific, dll)
2. **📊 Genre Favorit**: Genre apa yang paling sering ditonton (urutkan top 3)
3. **🌟 Pola Menonton**: Apakah user lebih suka anime panjang/pendek, modern/klasik, dll
4. **💡 Saran**: Satu genre atau tipe anime yang belum dicoba tapi mungkin cocok
5. **🏆 Anime Personality**: Beri user sebuah "judul" lucu berdasarkan taste mereka (contoh: "Si Pecinta Isekai", "Pejuang Shonen Sejati", dll)

Jawab dengan santai dan fun!`;

        result = await callGemini(analyzePrompt, SYSTEM_PROMPT);
        break;
      }

      // ── AI Review Generator ──────────────────
      case "review": {
        if (!body.animeTitle?.trim()) {
          return NextResponse.json({ error: "Missing 'animeTitle'" }, { status: 400 });
        }

        const reviewPrompt = `Buatkan review singkat dan menarik untuk anime **${body.animeTitle}** dalam Bahasa Indonesia.

Format review:
1. **Rating**: Beri rating X/10 beserta emoji bintang
2. **Satu Kalimat**: Ringkasan anime ini dalam 1 kalimat yang catchy
3. **Yang Bagus** (2-3 poin)
4. **Yang Kurang** (1-2 poin, jujur tapi tetap sopan)
5. **Cocok Untuk**: Tipe penonton yang akan menikmati anime ini
6. **Verdict**: Wajib tonton / Layak dicoba / Skip aja

Tulis dari perspektif reviewer anime yang berpengalaman tapi santai. Jangan spoiler!`;

        result = await callGemini(reviewPrompt, SYSTEM_PROMPT);
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${body.action}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("[AniBot] Error:", err);

    // Return user-friendly error message
    const isRateLimit = err.message?.includes("Rate") || err.message?.includes("429");
    return NextResponse.json(
      { 
        error: isRateLimit 
          ? "AI sedang sibuk, coba lagi dalam beberapa menit 🙏" 
          : (err.message || "Gagal memproses permintaan AI"),
      },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}
