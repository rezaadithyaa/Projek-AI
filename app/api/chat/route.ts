import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { Task, ScheduledTask } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages = [], tasks = [], schedule = [], apiKey: customApiKey } = body;

    // Determine API key
    const apiKey = (
      (typeof customApiKey === "string" && customApiKey.trim()) ? customApiKey.trim() :
      (process.env.GEMINI_API_KEY || "").trim()
    );

    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key kosong. Masukkan Gemini API Key via ⚙️ Settings di chatbot." },
        { status: 400 }
      );
    }

    // Build task context
    const activeTasks = (tasks as Task[]).filter((t) => !t.completed);
    const completedTasks = (tasks as Task[]).filter((t) => t.completed);

    const taskContext = activeTasks.length === 0
      ? "Tidak ada tugas aktif."
      : activeTasks.map((t) =>
          `- "${t.title}" (${t.duration} jam, deadline: ${t.deadlineDate}, prioritas: ${t.aiPriority || "belum dihitung"}, skor urgensi: ${t.aiUrgencyScore ?? "-"})`
        ).join("\n");

    const systemPrompt = `Kamu adalah Gemini AI Assistant untuk aplikasi "Perencana Tugas AI". Jawab dalam Bahasa Indonesia yang ramah, sopan, dan santun.

ATURAN FORMATTING WAJIB:
1. JANGAN PERNAH gunakan simbol asterisk (*) atau bold markdown (**) dalam jawabanmu.
2. Tulis dalam teks biasa yang bersih, elegan, dan gunakan baris baru atau nomor (1, 2, 3) secara natural.
3. Hindari tanda kutip berlebihan atau simbol markdown yang berantakan.

Data Tugas Pengguna:
Tugas aktif (${activeTasks.length}):
${taskContext}
Tugas selesai: ${completedTasks.length}

Jika diminta buat tugas baru, tambahkan JSON di baris paling akhir dalam tag <SUGGEST_TASK>{"title":"Judul","description":"Deskripsi","duration":1,"startDate":"${new Date().toISOString().split("T")[0]}","deadlineDate":"YYYY-MM-DD"}</SUGGEST_TASK>`;

    // Build conversation context string
    const lastUserMsg = messages.length > 0 ? messages[messages.length - 1].text : "";

    let conversationContext = "";
    if (messages.length > 1) {
      conversationContext = messages.slice(0, -1).map((m: { sender: string; text: string }) =>
        `${m.sender === "user" ? "Pengguna" : "Asisten"}: ${m.text}`
      ).join("\n\n");
      conversationContext = `\n\nRiwayat percakapan sebelumnya:\n${conversationContext}\n\n`;
    }

    const fullInput = `${systemPrompt}${conversationContext}\n\nPengguna: ${lastUserMsg}`;

    // Use @google/genai SDK with interactions API and gemini-3.5-flash
    const ai = new GoogleGenAI({ apiKey });

    const interaction = await ai.interactions.create({
      model: "gemini-3.5-flash",
      input: fullInput,
    });

    let responseText = interaction.output_text || "";

    if (!responseText) {
      return NextResponse.json(
        { error: "Gemini API mengembalikan respon kosong. Coba kirim ulang pesan Anda." },
        { status: 400 }
      );
    }

    // Parse suggested task
    let cleanText = responseText;
    let suggestedTask = null;
    const suggestMatch = cleanText.match(/<SUGGEST_TASK>([\s\S]*?)<\/SUGGEST_TASK>/);
    if (suggestMatch?.[1]) {
      try {
        suggestedTask = JSON.parse(suggestMatch[1].trim());
        cleanText = cleanText.replace(/<SUGGEST_TASK>[\s\S]*?<\/SUGGEST_TASK>/g, "").trim();
      } catch {
        // ignore parse error
      }
    }

    // Filter out all asterisks (* and **) from cleanText
    cleanText = cleanText
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1") // Strip bold/italic formatting
      .replace(/\*/g, "") // Remove any remaining asterisks
      .replace(/\n{3,}/g, "\n\n") // Clean up extra line breaks
      .trim();

    return NextResponse.json({
      text: cleanText,
      suggestedTask,
      isLiveGemini: true,
    });

  } catch (error: any) {
    console.error("[CHAT API] Error:", error?.message || error);
    return NextResponse.json(
      { error: `Gemini API Error: ${error?.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}
