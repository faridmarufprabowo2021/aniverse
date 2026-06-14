import { NextRequest, NextResponse } from "next/server";

/**
 * Anime Image Search — Gemini Vision API
 * Upload an image → identify which anime/character it is
 */

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

function getApiKeys(): string[] {
  const keys: string[] = [];
  if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY);
  if (process.env.GEMINI_API_KEY_2) keys.push(process.env.GEMINI_API_KEY_2);
  if (process.env.GEMINI_API_KEY_3) keys.push(process.env.GEMINI_API_KEY_3);
  if (process.env.GEMINI_API_KEYS) {
    keys.push(...process.env.GEMINI_API_KEYS.split(",").map(k => k.trim()).filter(Boolean));
  }
  return [...new Set(keys)];
}

const VISION_PROMPT = `Kamu adalah ahli identifikasi anime, manga, dan karakter Jepang. Analisis gambar yang diberikan secara detail dan berikan informasi selengkap mungkin.

## FORMAT JAWABAN (ikuti format ini persis):

### 🎬 Anime/Manga
- **Judul**: [Judul lengkap Jepang dan English/Romaji]
- **Tipe**: [TV / Movie / OVA / Manga / Manhwa]
- **Studio**: [Studio animasi]
- **Tahun**: [Tahun rilis / tayang]
- **Total Episode**: [Jumlah episode]
- **Status**: [Selesai / Sedang Tayang / Akan Datang]

### 👤 Karakter yang Teridentifikasi
Untuk SETIAP karakter yang terlihat di gambar:
1. **[Nama Karakter]** – [Deskripsi singkat: peran, sifat, kemampuan utama, hubungan dengan karakter lain]
2. **[Nama Karakter 2]** – [Deskripsi]
(lanjutkan untuk semua karakter yang terlihat)

### 📖 Sinopsis
[Tulis sinopsis lengkap anime/manga ini dalam 3-5 kalimat. Jelaskan premis cerita, konflik utama, dan apa yang membuat cerita ini menarik]

### 🎭 Genre & Tema
[Sebutkan genre: Action, Romance, dll] | [Tema utama: persahabatan, pengorbanan, dll]

### ⭐ Rating & Popularitas
- **MyAnimeList**: [Perkiraan rating /10]
- **Popularitas**: [Tinggi/Sedang/Rendah]
- **Target Audiens**: [Shounen/Shoujo/Seinen/Josei]

### 🖼️ Analisis Scene
[Deskripsikan adegan yang terlihat di gambar: apa yang sedang terjadi, emosi, konteks cerita jika bisa diidentifikasi]

### 💡 Rekomendasi Serupa
Jika kamu suka anime ini, coba tonton:
1. **[Judul 1]** – [Alasan singkat kenapa mirip]
2. **[Judul 2]** – [Alasan singkat]
3. **[Judul 3]** – [Alasan singkat]

### 🌟 Fakta Menarik
- [Fakta 1]
- [Fakta 2]

---
Jika tidak bisa mengidentifikasi anime spesifik, berikan tebakan terbaik berdasarkan gaya seni, desain karakter, atau elemen visual lainnya. Jelaskan reasoning kamu.

Jawab SELURUHNYA dalam Bahasa Indonesia. Gunakan **bold** untuk nama karakter dan judul anime.`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;
    const imageBase64 = formData.get("imageBase64") as string | null;

    let imageData: string;
    let mimeType: string;

    if (imageFile) {
      const buffer = await imageFile.arrayBuffer();
      imageData = Buffer.from(buffer).toString("base64");
      mimeType = imageFile.type || "image/jpeg";
    } else if (imageBase64) {
      // Strip data URL prefix if present
      const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        imageData = match[2];
      } else {
        imageData = imageBase64;
        mimeType = "image/jpeg";
      }
    } else {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const keys = getApiKeys();
    if (keys.length === 0) {
      return NextResponse.json({ error: "No API keys configured" }, { status: 500 });
    }

    let lastError = "";

    for (const key of keys) {
      try {
        const body = {
          contents: [{
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: imageData,
                },
              },
              { text: VISION_PROMPT },
            ],
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2500,
          },
        };

        const res = await fetch(`${GEMINI_BASE}/gemini-2.5-flash:generateContent?key=${key}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (res.status === 429 || res.status === 403) {
          lastError = `Key rate limited/forbidden`;
          continue;
        }

        if (!res.ok) {
          lastError = `API error: ${res.status}`;
          continue;
        }

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
          return NextResponse.json({ success: true, result: text });
        }

        lastError = "Empty response";
        continue;
      } catch (err: any) {
        lastError = err.message;
        continue;
      }
    }

    return NextResponse.json({ error: `Image search failed: ${lastError}` }, { status: 500 });
  } catch (err: any) {
    console.error("[Image Search] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process image" },
      { status: 500 }
    );
  }
}
