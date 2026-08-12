"use client";

import React, { useState, useEffect } from "react";
import TaskForm from "@/components/TaskForm";
import TaskList from "@/components/TaskList";
import Schedule from "@/components/Schedule";

import { Task, ScheduledTask } from "@/lib/types";
import { optimizeSchedule } from "@/lib/cpsolver";

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
    setTasks((current) => [...current, task]);
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
    const result = optimizeSchedule(tasks, start, end);
    setSchedule(result.schedule);
    setSkippedTasks(result.skippedTasks);
    setAlgorithmNote(result.algorithmNote);
  }

  function handleWorkHoursChange(start: string, end: string) {
    setWorkStart(start);
    setWorkEnd(end);
    if (tasks.length > 0 && schedule.length > 0) {
      const result = optimizeSchedule(tasks, start, end);
      setSchedule(result.schedule);
      setSkippedTasks(result.skippedTasks);
      setAlgorithmNote(result.algorithmNote);
    }
  }

  const urgentCount = tasks.filter(
    (t) => !t.completed && (t.aiPriority === "kritis" || t.aiPriority === "mendesak")
  ).length;
  const waitingCount = tasks.filter(
    (t) => !t.completed && t.aiPriority !== "kritis" && t.aiPriority !== "mendesak"
  ).length;
  const completedCount = tasks.filter((t) => t.completed).length;

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
    <div className="min-h-screen bg-[#f4f5f7] text-[#18181b] flex flex-col font-sans selection:bg-indigo-600 selection:text-white overflow-x-hidden">
      {/* STICKY NAVBAR */}
      <nav className="sticky top-0 z-50 bg-[#f4f5f7]/85 backdrop-blur-md border-b border-slate-200/60 transition-all duration-300">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          {/* BRAND LOGO */}
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => scrollToSection("hero")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white text-lg font-extrabold shadow-md shadow-indigo-500/20 group-hover:scale-105 group-hover:rotate-6 transition-all duration-300">
              ✦
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                Perencana Tugas AI
              </span>
              <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-bold text-purple-600 animate-pulse">
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
        {/* GLOWING BACKGROUND BLOB */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-indigo-200/40 via-purple-200/30 to-blue-200/30 blur-3xl rounded-full pointer-events-none animate-glow" />

        <div className="mx-auto max-w-5xl text-center relative z-10">
          {/* STATUS BADGE */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-4 py-1.5 text-xs font-semibold text-emerald-800 shadow-xs mb-8 animate-fade-in-up">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="h-2 w-2 rounded-full bg-emerald-500 absolute" />
            Penjadwalan AI aktif — Gratis & tanpa akun
          </div>

          {/* FLOATING BADGE LEFT */}
          <div className="hidden lg:flex absolute left-0 top-16 items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xl backdrop-blur-md animate-float-left hover:scale-110 transition duration-300">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs">
              ✓
            </span>
            <span>Tugas selesai hari ini: 4</span>
          </div>

          {/* FLOATING BADGE RIGHT */}
          <div className="hidden lg:flex absolute right-0 top-32 items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xl backdrop-blur-md animate-float-right hover:scale-110 transition duration-300">
            <span className="text-rose-500">⚡</span>
            <span>Efisiensi 94%</span>
          </div>

          {/* MAIN HEADLINE WITH FLOWING GRADIENT ANIMATION */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1] animate-fade-in-up delay-100">
            Atur Hari Anda <br />
            <span className="animate-text-gradient inline-block font-black py-1">
              Lebih Cerdas.
            </span>
          </h1>

          {/* SUBTITLE */}
          <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed animate-fade-in-up delay-200">
            Biarkan AI menyusun jadwal harian Anda secara otomatis. Cukup tambahkan tugas, tentukan prioritas, dan jadwal siap dalam hitungan detik.
          </p>

          {/* CTA BUTTONS */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 animate-fade-in-up delay-300">
            <button
              onClick={handleOpenApp}
              className="flex items-center gap-2 rounded-full bg-[#18181b] px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-slate-900/10 transition-all duration-300 hover:bg-slate-800 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span className="animate-spin text-indigo-400">✦</span>
              <span>Mulai Gratis — Sekarang</span>
            </button>

            <button
              onClick={() => scrollToSection("features")}
              className="rounded-full px-6 py-3.5 text-sm font-semibold text-slate-600 transition-all duration-300 hover:text-slate-900 hover:bg-slate-200/60 hover:scale-105 cursor-pointer"
            >
              Pelajari Fitur ↓
            </button>
          </div>
        </div>

        {/* HERO APP PREVIEW WINDOW */}
        <div
          className="mt-14 mx-auto max-w-4xl relative cursor-pointer group animate-scale-up delay-400"
          onClick={handleOpenApp}
        >
          {/* FLOATING SIDE BADGE LEFT */}
          <div className="hidden sm:flex absolute -left-10 top-1/2 -translate-y-1/2 z-20 items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xl backdrop-blur-md animate-float-left">
            <span className="text-base">🍓</span>
            <span>3 tugas terjadwal</span>
          </div>

          {/* FLOATING SIDE BADGE RIGHT */}
          <div className="hidden sm:flex absolute -right-10 top-1/2 -translate-y-1/2 z-20 items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xl backdrop-blur-md animate-float-right">
            <span className="text-amber-500">🔒</span>
            <span>Privasi 100%</span>
          </div>

          {/* WINDOW MOCKUP CARD */}
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 shadow-2xl shadow-slate-300/50 overflow-hidden backdrop-blur-xl transition-all duration-500 group-hover:shadow-indigo-300/50 group-hover:-translate-y-2">
            {/* WINDOW TOP BAR */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
              </div>
              <div className="text-xs font-mono text-slate-400 font-medium">
                perencana-tugas-ai-app
              </div>
              <div className="w-24 text-right">
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  Buka Form ↓
                </span>
              </div>
            </div>

            {/* WINDOW CONTENT */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* MOCKUP APP HEADER */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-bold">
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
                    <span className="line-through text-slate-400">Olahraga & Meditasi</span>
                  </div>
                  <span className="rounded-md bg-cyan-100 px-2 py-0.5 text-[11px] font-bold text-cyan-600">
                    Sedang
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-xs font-semibold text-slate-800 transition-all hover:bg-white hover:shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    <span>Pelajari Next.js App Router</span>
                  </div>
                  <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-600">
                    Sedang
                  </span>
                </div>
              </div>

              {/* MOCKUP FOOTER BAR */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-600 mb-2">
                  <span className="flex items-center gap-1">
                    <span>✦</span> AI: Jadwal Optimal Dihitung
                  </span>
                  <span>Efisiensi 94%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FEATURE TICKER MARQUEE */}
        <div className="mt-16 overflow-hidden py-4 border-y border-slate-200/60">
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
        </div>
      </section>

      {/* SECTION 1: FITUR UNGGULAN */}
      <section id="features" className="py-20 px-6 bg-white/60">
        <div className="mx-auto max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in-up">
            <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600">
              FITUR UNGGULAN
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Semua dalam Satu Tempat
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
              Dari manajemen tugas sederhana hingga penjadwalan AI otomatis — dirancang agar Anda tetap fokus dan produktif.
            </p>
          </div>

          {/* 4 CARDS GRID */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* CARD 1 */}
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

            {/* CARD 2 */}
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
                Tugas mendesak & bertenggat waktu dekat diprioritaskan otomatis di slot paling awal.
              </p>
            </div>

            {/* CARD 3 */}
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

            {/* CARD 4 */}
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
          </div>
        </div>
      </section>

      {/* SECTION 2: CARA KERJA */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in-up">
            <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600">
              CARA KERJA
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Tiga Langkah Mudah
            </h2>
          </div>

          {/* 3 STEPS GRID */}
          <div className="grid gap-8 sm:grid-cols-3">
            {/* STEP 1 */}
            <div className="group text-center space-y-4 transition-all duration-300 hover:-translate-y-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-600 text-white font-extrabold text-lg shadow-lg shadow-indigo-500/25 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                01
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Tambah Tugas
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Masukkan judul, durasi, prioritas, kategori, dan tenggat waktu tugas Anda.
              </p>
            </div>

            {/* STEP 2 */}
            <div className="group text-center space-y-4 transition-all duration-300 hover:-translate-y-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600 text-white font-extrabold text-lg shadow-lg shadow-blue-500/25 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                02
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                AI Menganalisis
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Algoritma CP mengevaluasi semua kendala dan menemukan urutan jadwal optimal.
              </p>
            </div>

            {/* STEP 3 */}
            <div className="group text-center space-y-4 transition-all duration-300 hover:-translate-y-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-600 text-white font-extrabold text-lg shadow-lg shadow-emerald-500/25 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                03
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Jadwal Siap!
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Dapatkan jadwal terstruktur per jam dengan skor efisiensi dan visualisasi timeline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA CARD */}
      <section className="py-16 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="group rounded-3xl bg-[#111827] text-white p-10 sm:p-14 text-center shadow-2xl relative overflow-hidden transition-all duration-500 hover:shadow-indigo-500/20">
            {/* BACKGROUND GLOW EFFECT */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/25 blur-3xl rounded-full pointer-events-none animate-glow" />

            <div className="relative z-10 space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
                🚀
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Siap Jadi Lebih Produktif?
              </h2>

              <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                Mulai kelola tugas Anda hari ini — gratis, tanpa daftar, langsung bisa digunakan.
              </p>

              <div>
                <button
                  onClick={handleOpenApp}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-slate-900 shadow-xl transition-all duration-300 hover:bg-slate-100 hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span className="text-indigo-600">✦</span>
                  <span>Buka Aplikasi Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* APP DASHBOARD SECTION (CONDITIONALLY UNHIDDEN & SCROLLED) */}
      {/* ======================================================== */}
      {showApp && (
        <section id="app-section" className="py-20 px-6 border-t border-slate-200/80 bg-white/90 animate-fade-in-up">
          <div className="mx-auto max-w-7xl">
            {/* DASHBOARD HEADER */}
            <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3.5 py-1 text-xs font-bold text-purple-700 mb-4">
                <span className="h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
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

            {/* MAIN DASHBOARD CONTENT GRID */}
            <div className="grid gap-8 lg:grid-cols-2 items-start">
              {/* LEFT COLUMN: FORM & TASK LIST */}
              <div className="space-y-8 animate-scale-up">
                <TaskForm onAddTask={addTask} />

                <TaskList
                  tasks={tasks}
                  onDelete={deleteTask}
                  onToggle={toggleTask}
                />
              </div>

              {/* RIGHT COLUMN: AI SCHEDULE OUTPUT */}
              <div className="sticky top-24 animate-scale-up delay-200">
                <Schedule
                  schedule={schedule}
                  onOptimize={handleOptimize}
                  hasTasks={tasks.length > 0}
                  workStart={workStart}
                  workEnd={workEnd}
                  onWorkHoursChange={handleWorkHoursChange}
                  skippedTasks={skippedTasks}
                  algorithmNote={algorithmNote}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-200/60 py-8 px-6 text-center text-xs text-slate-500">
        <div className="flex items-center justify-center gap-2 font-bold text-slate-700 mb-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-indigo-600 text-white text-[10px] animate-bounce">
            ✦
          </span>
          <span>Perencana Tugas AI</span>
        </div>
        <p>Dibuat dengan Next.js 16, React 19 & Tailwind CSS • Gratis selamanya</p>
      </footer>
    </div>
  );
}