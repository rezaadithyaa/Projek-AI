"use client";

import React, { useState, useEffect, useRef } from "react";
import { Task, ScheduledTask, ChatMessage, SuggestedTask } from "@/lib/types";

interface AiChatbotProps {
  tasks: Task[];
  schedule: ScheduledTask[];
  onAddTask: (task: Task) => void;
}

// Helper to strip any raw markdown asterisks (* or **)
function cleanMarkdownText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1") // strip bold/italics
    .replace(/\*/g, "")                      // remove any remaining stars
    .trim();
}

export default function AiChatbot({ tasks, schedule, onAddTask }: AiChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [inputKey, setInputKey] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome-1",
      sender: "ai",
      text: "Halo! Saya Asisten Cerdas. Saya siap membantu Anda mengelola tugas dan mengoptimalkan jadwal harian. Ada yang bisa saya bantu?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load API Key from localStorage if available
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem("gemini-api-key");
      if (savedKey) {
        setApiKey(savedKey);
        setInputKey(savedKey);
      }
    } catch {
      // ignore
    }
  }, []);

  // Auto scroll chat to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isLoading]);

  function handleSaveKey() {
    const trimmed = inputKey.trim();
    setApiKey(trimmed);
    try {
      localStorage.setItem("gemini-api-key", trimmed);
    } catch {
      // ignore
    }
    setShowSettings(false);
  }

  async function handleSendMessage(textToSend?: string) {
    const query = textToSend || inputMessage.trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: cleanMarkdownText(query),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          tasks,
          schedule,
          apiKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error && data.error.includes("API Key")) {
          setShowSettings(true);
        }
        throw new Error(data.error || "Gagal terhubung ke AI.");
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: cleanMarkdownText(data.text || "Terima kasih atas pesan Anda."),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestedTask: data.suggestedTask || undefined,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: "ai",
        text: `Respon AI: ${err.message || "Terjadi kendala koneksi."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleAddSuggestedTask(suggested: SuggestedTask) {
    const todayStr = new Date().toISOString().split("T")[0];
    const newTask: Task = {
      id: Date.now(),
      title: suggested.title,
      description: suggested.description,
      category: suggested.category || "Tugas Biasa",
      duration: suggested.duration || 1,
      startDate: suggested.startDate || todayStr,
      deadlineDate: suggested.deadlineDate || todayStr,
      completed: false,
    };

    onAddTask(newTask);

    const systemAck: ChatMessage = {
      id: `sys-${Date.now()}`,
      sender: "ai",
      text: `Tugas "${newTask.title}" berhasil ditambahkan ke daftar tugas Anda!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, systemAck]);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans select-none">
      {/* FLOATING BUTTON (HITAM PEKAT ELEGAN DENGAN ANIMASI) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-center rounded-full bg-zinc-950 w-14 h-14 text-white border border-zinc-800 shadow-[0_10px_35px_rgba(0,0,0,0.6)] hover:shadow-[0_15px_45px_rgba(0,0,0,0.9)] hover:border-zinc-600 hover:scale-[1.08] active:scale-95 transition-all duration-300 cursor-pointer"
          title="Asisten Cerdas"
        >
          {/* Animated subtle outer pulse */}
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-zinc-700 to-zinc-800 opacity-0 group-hover:opacity-100 blur-sm transition duration-500 pointer-events-none" />

          <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-700/80 text-white font-black text-base shadow-inner group-hover:rotate-12 transition-transform duration-300">
            ✦
          </div>
        </button>
      )}

      {/* CHAT MODAL DRAWER (HITAM PEKAT DENGAN FULL ANIMASI) */}
      {isOpen && (
        <div className="flex flex-col w-[94vw] sm:w-[420px] h-[610px] max-h-[85vh] rounded-3xl border border-zinc-800 bg-zinc-950 shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden transition-all duration-300 animate-scale-up">
          {/* HEADER HITAM PEKAT BERSIH */}
          <div className="relative flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950 px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-700/80 text-white font-extrabold text-sm shadow-inner animate-pulse">
                ✦
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-white tracking-tight">
                    Asisten Cerdas
                  </h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 font-medium">
                  Terintegrasi langsung ke daftar tugas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all duration-200 cursor-pointer"
                title="Pengaturan API Key"
              >
                ⚙️
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all duration-200 cursor-pointer"
                title="Tutup Chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* SETTINGS PANEL */}
          {showSettings && (
            <div className="border-b border-zinc-800 bg-zinc-900/90 p-4 space-y-2.5 animate-fade-in-up">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <span>🔑</span> Konfigurasi API Key
                </span>
                <span className="text-[10px] text-zinc-400 font-medium">
                  {apiKey ? "Key Tersimpan" : "Opsional"}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="Paste API Key"
                  className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs font-mono text-white outline-none focus:border-zinc-500 shadow-inner"
                />
                <button
                  type="button"
                  onClick={handleSaveKey}
                  className="rounded-xl bg-white text-zinc-950 px-4 py-2 text-xs font-extrabold hover:bg-zinc-200 active:scale-95 transition-all duration-200 cursor-pointer shadow-md"
                >
                  Simpan
                </button>
              </div>
            </div>
          )}

          {/* QUICK PROMPT CHIPS (HITAM PEKAT, ANIMASI HOVER, TANPA SCROLLBAR) */}
          <div className="flex gap-2 px-4 py-3 overflow-x-auto bg-zinc-950 border-b border-zinc-800/80 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {[
              { label: "⚡ Analisis Jadwal", query: "Bantu analisis jadwal saya hari ini, apakah sudah efektif?" },
              { label: "🔥 Tugas Mendesak?", query: "Tugas mana yang paling mendesak dan harus dikerjakan pertama?" },
              { label: "📅 Tambah Rapat", query: "Tolong buatkan tugas Rapat Sprint Klien besok durasi 1 jam" },
              { label: "💡 Tips Fokus", query: "Beri saya tips singkat untuk menjaga fokus hari ini." },
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(chip.query)}
                className="shrink-0 rounded-full border border-zinc-800 bg-zinc-900/90 px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800 hover:text-white hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer shadow-sm"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* CHAT MESSAGES BODY */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-950">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.sender === "user" ? "items-end" : "items-start"
                } animate-fade-in-up`}
              >
                <div
                  className={`rounded-2xl text-xs sm:text-sm leading-relaxed transition-all duration-200 ${
                    m.sender === "user"
                      ? "bg-zinc-900 border border-zinc-700/80 text-white rounded-tr-xs px-4 py-2.5 font-medium shadow-md max-w-[82%]"
                      : "bg-zinc-900/70 border border-zinc-800/90 text-zinc-100 rounded-tl-xs px-4 py-3 shadow-sm max-w-[88%]"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>

                  {/* SUGGESTED TASK HITAM ELEGAN CARD */}
                  {m.suggestedTask && (
                    <div className="mt-3.5 rounded-2xl border border-zinc-700/80 bg-zinc-900 p-4 space-y-2.5 text-white shadow-lg animate-scale-up">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <span>✦</span> Rekomendasi Tugas AI
                        </span>
                        <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-300 border border-zinc-700">
                          {m.suggestedTask.duration} jam
                        </span>
                      </div>

                      <h4 className="font-extrabold text-sm text-white">
                        {m.suggestedTask.title}
                      </h4>

                      {m.suggestedTask.description && (
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          {m.suggestedTask.description}
                        </p>
                      )}

                      <div className="text-[11px] font-medium text-zinc-400">
                        Tenggat: {m.suggestedTask.deadlineDate}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddSuggestedTask(m.suggestedTask!)}
                        className="w-full rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 py-2.5 text-center text-xs font-black shadow-md hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer"
                      >
                        + Tambahkan Ke Daftar Tugas
                      </button>
                    </div>
                  )}
                </div>
                <span className="mt-1 text-[10px] text-zinc-500 px-1 font-medium">
                  {m.timestamp}
                </span>
              </div>
            ))}

            {/* ANIMATED LOADING SPINNER */}
            {isLoading && (
              <div className="flex items-center gap-2.5 text-xs text-zinc-300 font-semibold bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 w-max shadow-sm animate-pulse">
                <span className="animate-spin text-sm text-white">✦</span>
                <span>Sedang memproses...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* INPUT FORM (HITAM PEKAT ELEGAN DENGAN ANIMASI) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="border-t border-zinc-800/80 bg-zinc-950 p-3.5 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Tulis pesan ke asisten..."
              disabled={isLoading}
              className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/90 px-4 py-3 text-xs sm:text-sm text-white placeholder:text-zinc-500 outline-none focus:border-zinc-500 focus:bg-zinc-900 focus:ring-2 focus:ring-zinc-700/40 transition-all duration-200"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-zinc-950 shadow-md hover:bg-zinc-200 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all duration-200 cursor-pointer font-black text-sm"
            >
              ➔
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
