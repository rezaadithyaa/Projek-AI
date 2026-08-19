"use client";

import React, { useState, useEffect, useMemo } from "react";
import TaskForm from "@/components/TaskForm";
import TaskList from "@/components/TaskList";
import Schedule from "@/components/Schedule";
import AiChatbot from "@/components/AiChatbot";
import ScrollReveal from "@/components/ScrollReveal";

import { Task, ScheduledTask } from "@/lib/types";
import { optimizeSchedule, enrichTaskWithAIPriority } from "@/lib/cpsolver";

export default function Home() {
  const [showApp, setShowApp] = useState(false);

  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("ai-planner-tasks");
      return saved ? (JSON.parse(saved) as Task[]) : [];
    } catch {
      return [];
    }
  });
  const [schedule, setSchedule] = useState<ScheduledTask[]>([]);
  const [skippedTasks, setSkippedTasks] = useState<Task[]>([]);
  const [algorithmNote, setAlgorithmNote] = useState<string>("");

  // Dynamically enrich all tasks with computed AI priority & score
  const enrichedTasks = useMemo(() => {
    return tasks.map(enrichTaskWithAIPriority);
  }, [tasks]);

  // Persist tasks to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("ai-planner-tasks", JSON.stringify(tasks));
    } catch {
      // ignore storage errors
    }
  }, [tasks]);

  // Free / Work hours state
  const [workStart, setWorkStart] = useState("08:00");
  const [workEnd, setWorkEnd] = useState("17:00");

  function addTask(task: Task) {
    const enriched = enrichTaskWithAIPriority(task);
    setTasks((current) => [...current, enriched]);
    setSchedule([]);
    setSkippedTasks([]);
    setAlgorithmNote("");
  }

  function deleteTask(id: number) {
    setTasks((current) => current.filter((task) => task.id !== id));
    setSchedule([]);
    setSkippedTasks([]);
    setAlgorithmNote("");
  }

  function toggleTask(id: number) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
    setSchedule([]);
    setSkippedTasks([]);
    setAlgorithmNote("");
  }

  function handleOptimize(start: string = workStart, end: string = workEnd) {
    const result = optimizeSchedule(enrichedTasks, start, end);
    setSchedule(result.schedule);
    setSkippedTasks(result.skippedTasks);
    setAlgorithmNote(result.algorithmNote);
  }

  function handleWorkHoursChange(start: string, end: string) {
    setWorkStart(start);
    setWorkEnd(end);
    if (enrichedTasks.length > 0 && schedule.length > 0) {
      const result = optimizeSchedule(enrichedTasks, start, end);
      setSchedule(result.schedule);
      setSkippedTasks(result.skippedTasks);
      setAlgorithmNote(result.algorithmNote);
    }
  }

  const urgentCount = enrichedTasks.filter(
    (t) => !t.completed && (t.aiPriority === "mendesak" || t.aiPriority === "tinggi")
  ).length;
  const waitingCount = enrichedTasks.filter(
    (t) => !t.completed && t.aiPriority !== "mendesak" && t.aiPriority !== "tinggi"
  ).length;
  const completedCount = enrichedTasks.filter((t) => t.completed).length;

  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  function handleOpenApp() {
    setShowApp(true);
    setTimeout(() => {
      scrollToSection("app-section");
    }, 100);
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-[#18181b] flex flex-col font-sans selection:bg-zinc-900 selection:text-white overflow-x-hidden">
      {/* STICKY NAVBAR */}
      <nav className="sticky top-0 z-50 bg-[#f4f5f7]/85 backdrop-blur-md border-b border-slate-200/60 transition-all duration-300">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          {/* BRAND LOGO */}
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => scrollToSection("hero")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-950 text-white text-lg font-extrabold shadow-md group-hover:scale-105 group-hover:rotate-6 transition-all duration-300">
              ✦
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight text-slate-900 group-hover:text-zinc-700 transition-colors">
                Perencana Tugas AI
              </span>
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-bold text-zinc-700">
                Beta
              </span>
            </div>
          </div>

          {/* NAVBAR RIGHT ACTIONS */}
          <div className="flex items-center gap-4">
            {showApp && (
              <div className="hidden md:flex items-center gap-4 text-xs font-bold animate-fade-in-up">
                <span className="text-amber-600">🟡 {waitingCount} Menunggu</span>
                <span className="text-rose-600">🔴 {urgentCount} Mendesak</span>
                <span className="text-emerald-600">🟢 {completedCount} Selesai</span>
              </div>
            )}

            <button
              onClick={handleOpenApp}
              className="relative overflow-hidden rounded-full bg-[#18181b] px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-300 hover:bg-slate-800 hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
            >
              Mulai Sekarang
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section id="hero" className="relative overflow-hidden pt-12 pb-16 px-6">
        {/* SUBTLE BACKGROUND GRID MESH */}
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:28px_28px] opacity-40 pointer-events-none" />

        {/* GLOWING AMBIENT LIGHTS */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-slate-200/50 via-zinc-200/35 to-slate-200/50 blur-3xl rounded-full pointer-events-none" />

        {/* LEFT FLANK FLOATING TELEMETRY WIDGETS (ANIMATED FADE-IN & SCROLL REVEAL) */}
        <div className="hidden xl:flex flex-col gap-4 absolute left-4 2xl:left-12 top-20 z-20 pointer-events-auto max-w-[270px]">
          {/* WIDGET 1: LIVE CP SOLVER ENGINE */}
          <ScrollReveal direction="left" delay={150}>
            <div className="rounded-2xl border border-zinc-800/90 bg-zinc-950/95 p-4 text-white shadow-[0_15px_35px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-300 hover:border-zinc-600 hover:scale-[1.03] group cursor-default">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-[11px] font-extrabold tracking-wider uppercase text-zinc-300">
                    CP Solver Engine
                  </span>
                </div>
                <span className="rounded-md bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 text-[10px] font-mono text-zinc-300">
                  14ms
                </span>
              </div>
              <div className="text-xs font-extrabold text-white">
                0 Konflik Jadwal • Optimal
              </div>
              <p className="mt-1 text-[11px] text-zinc-400 leading-relaxed font-medium">
                Algoritma matematis menyusun urutan tugas bebas tumpang tindih.
              </p>
            </div>
          </ScrollReveal>

          {/* WIDGET 2: SMART URGENCY RADAR */}
          <ScrollReveal direction="left" delay={300}>
            <div className="rounded-2xl border border-zinc-800/90 bg-zinc-950/95 p-4 text-white shadow-[0_15px_35px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-300 hover:border-zinc-600 hover:scale-[1.03] group cursor-default">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <span className="animate-pulse">🔥</span> Prioritas Otomatis
                </span>
                <span className="rounded-full bg-rose-950/80 border border-rose-800/60 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                  Skor: 98
                </span>
              </div>
              <div className="text-xs font-extrabold text-white">
                Review Arsitektur → Slot #1
              </div>
              <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                <span>Deadline 12 Agu • Bobot 1.25h</span>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* RIGHT FLANK FLOATING TELEMETRY WIDGETS (ANIMATED FADE-IN & SCROLL REVEAL) */}
        <div className="hidden xl:flex flex-col gap-4 absolute right-4 2xl:right-12 top-20 z-20 pointer-events-auto max-w-[270px]">
          {/* WIDGET 3: DAILY EFFICIENCY GAUGE */}
          <ScrollReveal direction="right" delay={150}>
            <div className="rounded-2xl border border-zinc-800/90 bg-zinc-950/95 p-4 text-white shadow-[0_15px_35px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-300 hover:border-zinc-600 hover:scale-[1.03] group cursor-default">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span>⚡</span> Skor Efisiensi
                </span>
                <span className="rounded-md bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  Optimal
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-black text-white">94%</div>
                <div className="text-right">
                  <span className="block text-[11px] font-bold text-emerald-400">+18% efisiensi</span>
                  <span className="text-[10px] text-zinc-500">vs jadwal manual</span>
                </div>
              </div>
              <div className="mt-2.5 h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 animate-pulse" />
              </div>
            </div>
          </ScrollReveal>

          {/* WIDGET 4: ON-DEVICE ZERO LATENCY SHIELD */}
          <ScrollReveal direction="right" delay={300}>
            <div className="rounded-2xl border border-zinc-800/90 bg-zinc-950/95 p-4 text-white shadow-[0_15px_35px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-300 hover:border-zinc-600 hover:scale-[1.03] group cursor-default">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <span>🛡️</span> 100% On-Device
                </span>
                <span className="rounded-full bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-[10px] font-bold text-zinc-300">
                  Private
                </span>
              </div>
              <div className="text-xs font-extrabold text-white">
                Data Tersimpan di Browser
              </div>
              <p className="mt-1 text-[11px] text-zinc-400 leading-relaxed font-medium">
                Bekerja instan offline tanpa perlu login &amp; tanpa pelacak.
              </p>
            </div>
          </ScrollReveal>
        </div>


        <div className="mx-auto max-w-5xl text-center relative z-10">
          <ScrollReveal direction="up" delay={0}>
            {/* STATUS BADGE */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-4 py-1.5 text-xs font-semibold text-emerald-800 shadow-xs mb-8">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="h-2 w-2 rounded-full bg-emerald-500 absolute" />
              Penjadwalan AI aktif Gratis & tanpa akun
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={100}>
            {/* MAIN HEADLINE */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              Atur Hari Anda <br />
              <span className="text-zinc-950 inline-block font-black py-1">
                Lebih Cerdas.
              </span>
            </h1>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={200}>
            {/* SUBTITLE */}
            <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed">
              Biarkan AI menyusun jadwal harian Anda secara otomatis. Cukup tambahkan tugas, tentukan prioritas, dan jadwal siap dalam hitungan detik.
            </p>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={300}>
            {/* CTA BUTTONS */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={handleOpenApp}
                className="flex items-center gap-2 rounded-full bg-[#18181b] px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-slate-900/10 transition-all duration-300 hover:bg-slate-800 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span className="text-zinc-300">✦</span>
                <span>Mulai Gratis Sekarang</span>
              </button>

              <button
                onClick={() => scrollToSection("features")}
                className="rounded-full px-6 py-3.5 text-sm font-semibold text-slate-600 transition-all duration-300 hover:text-slate-900 hover:bg-slate-200/60 hover:scale-105 cursor-pointer"
              >
                Pelajari Fitur ↓
              </button>
            </div>
          </ScrollReveal>
        </div>


        {/* HERO APP PREVIEW WINDOW (CLEAN, NO OVERLAPPING BADGES) */}
        <ScrollReveal direction="scale" delay={250} className="mt-14 mx-auto max-w-4xl relative">
          <div
            className="cursor-pointer group"
            onClick={handleOpenApp}
          >
            {/* WINDOW MOCKUP CARD */}
            <div className="rounded-3xl border border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-300/60 overflow-hidden backdrop-blur-xl transition-all duration-500 group-hover:shadow-slate-400/50 group-hover:-translate-y-1">
              {/* WINDOW TOP BAR */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <div className="text-xs font-mono text-slate-400 font-medium">
                  perencana-tugas-ai-app
                </div>
                <div className="w-24 text-right">
                  <span className="text-[10px] font-bold text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded-full group-hover:bg-zinc-900 group-hover:text-white transition-all">
                    Buka Form ↓
                  </span>
                </div>
              </div>

              {/* WINDOW CONTENT */}
              <div className="p-6 sm:p-8 space-y-6">
                {/* MOCKUP APP HEADER */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white text-xs font-bold">
                      ✦
                    </div>
                    <span className="font-extrabold text-sm text-slate-900">
                      Perencana Tugas AI
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-bold">
                    <span className="text-amber-600">3 Menunggu</span>
                    <span className="text-rose-600">1 Mendesak</span>
                    <span className="text-emerald-600">1 Selesai</span>
                  </div>
                </div>

                {/* MOCKUP TASK LIST */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-xs font-semibold text-slate-800 transition-all hover:bg-white hover:shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                      <span>Review Arsitektur Sistem</span>
                    </div>
                    <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-600">
                      Mendesak
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-xs font-semibold text-slate-800 transition-all hover:bg-white hover:shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <span>Rapat Sprint dengan Klien</span>
                    </div>
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-600">
                      Tinggi
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-xs font-semibold text-slate-800 transition-all hover:bg-white hover:shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="line-through text-slate-400">Olahraga &amp; Meditasi</span>
                    </div>
                    <span className="rounded-md bg-cyan-100 px-2 py-0.5 text-[11px] font-bold text-cyan-600">
                      Sedang
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-xs font-semibold text-slate-800 transition-all hover:bg-white hover:shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>Pelajari Next.js App Router</span>
                    </div>
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                      Rendah
                    </span>
                  </div>
                </div>

                {/* MOCKUP FOOTER BAR */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-900 mb-2">
                    <span className="flex items-center gap-1">
                      <span>✦</span> AI: Jadwal Optimal Dihitung
                    </span>
                    <span>Efisiensi 94%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-zinc-700 via-zinc-900 to-black animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* FEATURE TICKER MARQUEE */}
        <ScrollReveal direction="up" delay={350} className="mt-16 overflow-hidden py-4 border-y border-slate-200/60">
          <div className="animate-marquee flex items-center gap-8 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-2">⚡ Prioritas Cerdas</span>
            <span>•</span>
            <span className="flex items-center gap-2">🔒 Privasi 100%</span>
            <span>•</span>
            <span className="flex items-center gap-2">📊 Analitik Produktivitas</span>
            <span>•</span>
            <span className="flex items-center gap-2">✅ Tanpa Daftar Akun</span>
            <span>•</span>
            <span className="flex items-center gap-2">🌐 Open Source Friendly</span>
            <span>•</span>
            <span className="flex items-center gap-2">⚡ Real-Time Update</span>
            <span>•</span>
            <span className="flex items-center gap-2">🤖 Penjadwalan Otomatis AI</span>
            <span>•</span>
            <span className="flex items-center gap-2">⚡ Prioritas Cerdas</span>
            <span>•</span>
            <span className="flex items-center gap-2">🔒 Privasi 100%</span>
            <span>•</span>
            <span className="flex items-center gap-2">📊 Analitik Produktivitas</span>
            <span>•</span>
            <span className="flex items-center gap-2">✅ Tanpa Daftar Akun</span>
            <span>•</span>
            <span className="flex items-center gap-2">🌐 Open Source Friendly</span>
          </div>
        </ScrollReveal>
      </section>

      {/* SECTION 1: FITUR UNGGULAN */}
      <section id="features" className="py-20 px-6 bg-white/60">
        <div className="mx-auto max-w-5xl">
          <ScrollReveal direction="up" delay={0}>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-extrabold uppercase tracking-widest text-zinc-800">
                FITUR UNGGULAN
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Semua dalam Satu Tempat
              </h2>
              <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
                Dari manajemen tugas sederhana hingga penjadwalan AI otomatis dirancang agar Anda tetap fokus dan produktif.
              </p>
            </div>
          </ScrollReveal>

          {/* 4 CARDS GRID */}
          <div className="grid gap-6 sm:grid-cols-2">
            <ScrollReveal direction="up" delay={100}>
              <div className="group rounded-3xl border border-slate-200/80 bg-white p-8 shadow-lg shadow-slate-200/40 transition-all duration-300 hover:shadow-2xl hover:border-amber-300 hover:-translate-y-2">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 text-xl font-bold group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                    ⚡
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
                    Instant
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                  Penjadwalan Otomatis AI
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Algoritma Constraint Programming menyusun jadwal harian optimal dalam kurang dari 1 detik.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={200}>
              <div className="group rounded-3xl border border-slate-200/80 bg-white p-8 shadow-lg shadow-slate-200/40 transition-all duration-300 hover:shadow-2xl hover:border-rose-300 hover:-translate-y-2">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 text-xl font-bold group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                    🎯
                  </div>
                  <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200">
                    Smart
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
                  Prioritas Cerdas
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Tugas mendesak &amp; bertenggat waktu dekat diprioritaskan otomatis di slot paling awal.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={300}>
              <div className="group rounded-3xl border border-slate-200/80 bg-white p-8 shadow-lg shadow-slate-200/40 transition-all duration-300 hover:shadow-2xl hover:border-cyan-300 hover:-translate-y-2">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-600 text-xl font-bold group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                    📊
                  </div>
                  <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700 border border-cyan-200">
                    Analytics
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">
                  Skor Efisiensi Harian
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Pantau produktivitas Anda dengan metrik efisiensi dan linimasa visual setiap hari.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={400}>
              <div className="group rounded-3xl border border-slate-200/80 bg-white p-8 shadow-lg shadow-slate-200/40 transition-all duration-300 hover:shadow-2xl hover:border-emerald-300 hover:-translate-y-2">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 text-xl font-bold group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                    🔒
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                    Private
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Privasi 100%
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Data tersimpan sepenuhnya di perangkat Anda. Tidak ada server, tidak ada akun.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* SECTION 2: CARA KERJA */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <ScrollReveal direction="up" delay={0}>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-extrabold uppercase tracking-widest text-zinc-800">
                CARA KERJA
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Tiga Langkah Mudah
              </h2>
            </div>
          </ScrollReveal>

          {/* 3 STEPS GRID */}
          <div className="grid gap-8 sm:grid-cols-3">
            <ScrollReveal direction="up" delay={100}>
              <div className="group text-center space-y-4 transition-all duration-300 hover:-translate-y-2">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-zinc-950 text-white font-extrabold text-lg shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  01
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-zinc-700 transition-colors">
                  Tambah Tugas
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Masukkan judul, durasi, prioritas, kategori, dan tenggat waktu tugas Anda.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={200}>
              <div className="group text-center space-y-4 transition-all duration-300 hover:-translate-y-2">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-zinc-800 text-white font-extrabold text-lg shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  02
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-zinc-700 transition-colors">
                  AI Menganalisis
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Algoritma CP mengevaluasi semua kendala dan menemukan urutan jadwal optimal.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={300}>
              <div className="group text-center space-y-4 transition-all duration-300 hover:-translate-y-2">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-zinc-950 text-white font-extrabold text-lg shadow-lg shadow-zinc-900/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  03
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-zinc-700 transition-colors">
                  Jadwal Siap!
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Dapatkan jadwal terstruktur per jam dengan skor efisiensi dan visualisasi timeline.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA CARD */}
      <section className="py-16 px-6">
        <ScrollReveal direction="scale" delay={100} className="mx-auto max-w-4xl">
          <div className="group rounded-3xl bg-zinc-950 text-white p-10 sm:p-14 text-center shadow-2xl relative overflow-hidden transition-all duration-500">
            <div className="relative z-10 space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
                🚀
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Siap Jadi Lebih Produktif?
              </h2>

              <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                Mulai kelola tugas Anda hari ini gratis, tanpa daftar, langsung bisa digunakan.
              </p>

              <div>
                <button
                  onClick={handleOpenApp}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-slate-900 shadow-xl transition-all duration-300 hover:bg-slate-100 hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span className="text-zinc-900">✦</span>
                  <span>Buka Aplikasi Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>
      {/* ======================================================== */}
      {/* APP DASHBOARD SECTION (CONDITIONALLY UNHIDDEN & SCROLLED) */}
      {/* ======================================================== */}
      {showApp && (
        <section id="app-section" className="py-20 px-6 border-t border-slate-200/80 bg-white/90">
          <div className="mx-auto max-w-7xl">
            {/* DASHBOARD HEADER */}
            <ScrollReveal direction="up" delay={0}>
              <div className="text-center max-w-3xl mx-auto mb-12">
                <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-100 px-3.5 py-1 text-xs font-bold text-zinc-800 mb-4">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Aplikasi Aktif
                </div>

                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  Kelola Tugas Anda
                </h2>

                <p className="mt-2 text-sm sm:text-base text-slate-500 leading-relaxed">
                  Tambahkan tugas, lalu tentukan waktu luang pengerjaan untuk mendapatkan jadwal optimal hari ini.
                </p>

                {/* STATUS COUNTERS */}
                <div className="mt-4 flex items-center justify-center gap-6 text-xs font-extrabold">
                  <span className="text-amber-600">🟡 Menunggu: {waitingCount}</span>
                  <span className="text-rose-600">🔴 Mendesak: {urgentCount}</span>
                  <span className="text-emerald-600">🟢 Selesai: {completedCount}</span>
                </div>
              </div>
            </ScrollReveal>

            {/* MAIN DASHBOARD CONTENT GRID */}
            <div className="grid gap-8 lg:grid-cols-2 items-start">
              {/* LEFT COLUMN: FORM & TASK LIST */}
              <ScrollReveal direction="up" delay={100} className="space-y-8">
                <TaskForm onAddTask={addTask} />

                <TaskList
                  tasks={enrichedTasks}
                  onDelete={deleteTask}
                  onToggle={toggleTask}
                />
              </ScrollReveal>

              {/* RIGHT COLUMN: AI SCHEDULE OUTPUT */}
              <ScrollReveal direction="up" delay={200} className="sticky top-24">
                <Schedule
                  schedule={schedule}
                  onOptimize={handleOptimize}
                  hasTasks={enrichedTasks.length > 0}
                  workStart={workStart}
                  workEnd={workEnd}
                  onWorkHoursChange={handleWorkHoursChange}
                  skippedTasks={skippedTasks}
                  algorithmNote={algorithmNote}
                />
              </ScrollReveal>
            </div>
          </div>
        </section>
      )}


      {/* FLOATING GEMINI AI CHATBOT ASSISTANT */}
      <AiChatbot
        tasks={enrichedTasks}
        schedule={schedule}
        onAddTask={addTask}
      />

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-200/60 py-8 px-6 text-center text-xs text-slate-500">
        <div className="flex items-center justify-center gap-2 font-bold text-slate-700 mb-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-indigo-600 text-white text-[10px] animate-bounce">
            ✦
          </span>
          <span>Kelompok Memperingati Kemerdekaan</span>
        </div>
        <p>Directed By Reza Adithya - Raisya Andhika - Dimas Akhmad</p>
      </footer>
    </div>
  );
}
