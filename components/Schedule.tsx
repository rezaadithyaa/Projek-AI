"use client";

import { useState } from "react";
import { ScheduledTask, AIPriority, Task } from "@/lib/types";

interface ScheduleProps {
    schedule: ScheduledTask[];
    onOptimize?: (workStart: string, workEnd: string) => void;
    hasTasks?: boolean;
    workStart: string;
    workEnd: string;
    onWorkHoursChange: (start: string, end: string) => void;
    skippedTasks?: Task[];
    algorithmNote?: string;
}

export default function Schedule({
    schedule,
    onOptimize,
    hasTasks,
    workStart,
    workEnd,
    onWorkHoursChange,
    skippedTasks = [],
    algorithmNote = "",
}: ScheduleProps) {
    const [showAlgorithmInfo, setShowAlgorithmInfo] = useState(false);
    const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);

    const getPriorityBadge = (p?: AIPriority) => {
        switch (p) {
            case "kritis":
                return "bg-rose-100 text-rose-700 border-rose-200";
            case "mendesak":
                return "bg-amber-100 text-amber-700 border-amber-200";
            case "normal":
                return "bg-blue-100 text-blue-700 border-blue-200";
            case "santai":
                return "bg-emerald-100 text-emerald-700 border-emerald-200";
            default:
                return "bg-slate-100 text-slate-500 border-slate-200";
        }
    };

    const getPriorityLabel = (p?: AIPriority) => {
        switch (p) {
            case "kritis": return "🔴 Kritis";
            case "mendesak": return "🟠 Mendesak";
            case "normal": return "🔵 Normal";
            case "santai": return "🟢 Santai";
            default: return "⚪ -";
        }
    };

    const getPriorityDot = (p?: AIPriority) => {
        switch (p) {
            case "kritis": return "bg-rose-500";
            case "mendesak": return "bg-amber-500";
            case "normal": return "bg-blue-500";
            case "santai": return "bg-emerald-500";
            default: return "bg-slate-400";
        }
    };

    const formatDuration = (hours: number) => {
        if (hours < 1) return `${Math.round(hours * 60)}m`;
        return `${hours}h`;
    };

    const formatDateDisplay = (dateStr?: string) => {
        if (!dateStr) return "-";
        const parts = dateStr.split("-");
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return dateStr;
    };

    return (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-6">
            {/* CARD HEADER */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                        <span>🕒 Jadwal Harian AI</span>
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-400 max-w-sm">
                        Algoritma CP mengoptimalkan tugas mendesak &amp; memaksimalkan waktu luang Anda.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => onOptimize?.(workStart, workEnd)}
                    disabled={!hasTasks}
                    className="flex items-center gap-2 rounded-2xl bg-[#18181b] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                    <span>✨</span>
                    <span>Jadwalkan Otomatis</span>
                </button>
            </div>

            {/* WAKTU LUANG (JAM KERJA) SETTING PANEL */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                        <span>⏳</span> Waktu Luang Pengerjaan
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                        {workStart} — {workEnd}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Jam Mulai
                        </label>
                        <input
                            type="time"
                            value={workStart}
                            onChange={(e) => onWorkHoursChange(e.target.value, workEnd)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-2xs"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Jam Selesai
                        </label>
                        <input
                            type="time"
                            value={workEnd}
                            onChange={(e) => onWorkHoursChange(workStart, e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-2xs"
                        />
                    </div>
                </div>

                {/* PRESETS */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                        type="button"
                        onClick={() => onWorkHoursChange("08:00", "17:00")}
                        className="rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
                    >
                        ☀️ 08:00 - 17:00 (Jam Kerja)
                    </button>
                    <button
                        type="button"
                        onClick={() => onWorkHoursChange("16:00", "22:00")}
                        className="rounded-lg border border-purple-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-purple-700 hover:bg-purple-100 transition cursor-pointer"
                    >
                        🌙 16:00 - 22:00 (Malam)
                    </button>
                    <button
                        type="button"
                        onClick={() => onWorkHoursChange("09:00", "21:00")}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    >
                        ⚡ 09:00 - 21:00 (Fleksibel)
                    </button>
                </div>
            </div>

            {/* EMPTY STATE OR TIMELINE */}
            {schedule.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-10 text-center min-h-[220px]">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 text-3xl shadow-xs">
                        📅
                    </div>
                    <h3 className="text-base font-bold text-slate-800">
                        Belum ada jadwal aktif
                    </h3>
                    <p className="mt-1 text-xs text-slate-400 max-w-xs leading-relaxed">
                        Tentukan jam luang di atas lalu klik <span className="font-bold text-indigo-600">&quot;Jadwalkan Otomatis&quot;</span>.
                    </p>
                </div>
            ) : (
                <div className="space-y-0 pt-2">
                    {schedule.map((task, index) => (
                        <div
                            key={task.id}
                            className="relative flex items-start gap-4 pb-6"
                        >
                            {/* TIME */}
                            <div className="flex flex-col text-right text-xs font-mono font-bold text-indigo-600 w-16 shrink-0 pt-0.5">
                                <span>{task.start}</span>
                                <small className="text-slate-400 font-normal">{task.end}</small>
                            </div>

                            {/* TIMELINE CONNECTOR */}
                            <div className="relative flex flex-col items-center shrink-0 self-stretch pt-1.5">
                                <div className="h-4 w-4 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 ring-4 ring-white shadow-md shadow-indigo-300 z-10" />
                                {index !== schedule.length - 1 && (
                                    <div className="w-0.5 bg-indigo-200 flex-1 my-1" />
                                )}
                            </div>

                            {/* TASK DETAILS CARD */}
                            <div className="flex-1 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all hover:bg-white hover:shadow-md">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="inline-flex items-center gap-1 rounded-md bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-700 mb-1">
                                            🕒 {task.start} - {task.end}
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-sm">
                                            {task.title}
                                        </h3>
                                    </div>

                                    <span
                                        className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${getPriorityBadge(
                                            task.aiPriority
                                        )}`}
                                    >
                                        {getPriorityLabel(task.aiPriority)}
                                    </span>
                                </div>

                                {task.description && (
                                    <p className="mt-1.5 text-xs text-slate-500">
                                        {task.description}
                                    </p>
                                )}

                                <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-200/60 pt-2 text-[11px] text-slate-500 font-medium">
                                    <span>⏱️ Durasi: {formatDuration(task.duration)}</span>
                                    <span>•</span>
                                    <span>📅 Deadline: {formatDateDisplay(task.deadlineDate)}</span>
                                </div>

                                {/* REASON TOGGLE */}
                                {task.reason && (
                                    <div className="mt-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setExpandedTaskId(
                                                    expandedTaskId === task.id ? null : task.id
                                                )
                                            }
                                            className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                                        >
                                            <span>{expandedTaskId === task.id ? "▲" : "▼"}</span>
                                            <span>
                                                {expandedTaskId === task.id
                                                    ? "Sembunyikan alasan"
                                                    : "Kenapa tugas ini dijadwalkan di sini?"}
                                            </span>
                                        </button>
                                        {expandedTaskId === task.id && (
                                            <div className="mt-2 rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-2.5 text-[11px] text-indigo-800 leading-relaxed font-medium animate-fade-in-up">
                                                🤖 <span className="font-bold">AI Explanation:</span>{" "}
                                                {task.reason}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* SKIPPED TASKS */}
                    {skippedTasks.length > 0 && (
                        <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-2">
                            <p className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                                <span>⚠️</span> {skippedTasks.length} tugas tidak muat dalam jendela waktu
                            </p>
                            <div className="flex flex-col gap-1.5">
                                {skippedTasks.map((t) => (
                                    <div
                                        key={t.id}
                                        className="flex items-center gap-2 text-[11px] font-medium text-amber-700"
                                    >
                                        <span
                                            className={`h-2 w-2 rounded-full shrink-0 ${getPriorityDot(
                                                t.aiPriority
                                            )}`}
                                        />
                                        <span className="font-bold">{t.title}</span>
                                        <span className="text-amber-500">
                                            ({t.duration}h — melewati batas {workEnd})
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-amber-600 font-normal">
                                Perluas jam kerja atau kurangi jumlah tugas agar semua bisa terjadwal.
                            </p>
                        </div>
                    )}

                    {/* OPTIMIZATION NOTE */}
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs font-semibold text-emerald-800">
                        <p className="flex items-center gap-1.5 font-bold">
                            <span>✨</span> AI: Jadwal Optimal Berhasil Dihitung ({workStart} - {workEnd})
                        </p>
                        <p className="mt-1 text-[11px] text-emerald-700 font-normal leading-relaxed">
                            Tugas Anda telah disusun rapi pada rentang waktu luang {workStart} sampai{" "}
                            {workEnd} berdasarkan prioritas mendesak dan tenggat tanggal.
                        </p>
                    </div>

                    {/* ALGORITHM EXPLANATION PANEL */}
                    {algorithmNote && (
                        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setShowAlgorithmInfo(!showAlgorithmInfo)}
                                className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            >
                                <span className="flex items-center gap-2">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white text-[10px] font-extrabold">CP</span>
                                    Bagaimana algoritma CP membuat keputusan ini?
                                </span>
                                <span className="text-slate-400 text-[10px]">
                                    {showAlgorithmInfo ? "▲ Tutup" : "▼ Pelajari"}
                                </span>
                            </button>

                            {showAlgorithmInfo && (
                                <div className="px-4 pb-4 space-y-4 animate-fade-in-up">
                                    {/* Algorithm note */}
                                    <p className="text-[11px] text-slate-600 leading-relaxed border-t border-slate-200 pt-3">
                                        {algorithmNote}
                                    </p>

                                    {/* CP Visual Steps */}
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {[
                                            {
                                                icon: "①",
                                                color: "bg-rose-50 border-rose-100 text-rose-700",
                                                title: "Kumpulkan & Nilai",
                                                desc: "Semua tugas aktif dikumpulkan dan diberi skor prioritas (1–4).",
                                            },
                                            {
                                                icon: "②",
                                                color: "bg-amber-50 border-amber-100 text-amber-700",
                                                title: "Urutkan",
                                                desc: "Tugas diurutkan dari prioritas tertinggi. Jika sama, tenggat terdekat menang.",
                                            },
                                            {
                                                icon: "③",
                                                color: "bg-blue-50 border-blue-100 text-blue-700",
                                                title: "Tempatkan",
                                                desc: "Setiap tugas ditempatkan ke slot waktu berikutnya yang kosong secara berurutan.",
                                            },
                                            {
                                                icon: "④",
                                                color: "bg-emerald-50 border-emerald-100 text-emerald-700",
                                                title: "Periksa Kendala",
                                                desc: `Jika tugas melebihi batas ${workEnd}, tugas dilewati untuk menjaga jadwal valid.`,
                                            },
                                        ].map((step) => (
                                            <div
                                                key={step.icon}
                                                className={`rounded-xl border p-3 ${step.color}`}
                                            >
                                                <p className="font-extrabold text-sm mb-0.5">
                                                    {step.icon} {step.title}
                                                </p>
                                                <p className="text-[11px] font-normal leading-relaxed opacity-80">
                                                    {step.desc}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Priority table */}
                                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                                        <div className="bg-slate-100 px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                                            Tabel Skor AI Priority
                                        </div>
                                        <div className="divide-y divide-slate-100">
                                            {[
                                                { label: "Kritis", value: "85–100", color: "text-rose-600", bg: "bg-rose-50" },
                                                { label: "Mendesak", value: "60–84", color: "text-amber-600", bg: "bg-amber-50" },
                                                { label: "Normal", value: "30–59", color: "text-blue-600", bg: "bg-blue-50" },
                                                { label: "Santai", value: "0–29", color: "text-emerald-600", bg: "bg-emerald-50" },
                                            ].map((row) => (
                                                <div
                                                    key={row.label}
                                                    className={`flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold ${row.bg}`}
                                                >
                                                    <span className={row.color}>{row.label}</span>
                                                    <span className="font-mono font-bold text-slate-700">
                                                        {row.value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}