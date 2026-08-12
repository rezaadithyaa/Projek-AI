"use client";

import { useState } from "react";
import { Task, AIPriority } from "@/lib/types";

interface TaskListProps {
    tasks: Task[];
    onDelete: (id: number) => void;
    onToggle?: (id: number) => void;
}

export default function TaskList({
    tasks,
    onDelete,
    onToggle,
}: TaskListProps) {
    const [selectedStatus, setSelectedStatus] = useState<string>("Semua");

    const filteredTasks = tasks.filter((task) => {
        if (selectedStatus === "Belum" && task.completed) return false;
        if (selectedStatus === "Selesai" && !task.completed) return false;
        return true;
    });

    const getAIPriorityBadge = (p?: AIPriority) => {
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

    const getAIPriorityLabel = (p?: AIPriority) => {
        switch (p) {
            case "kritis":
                return "🔴 Kritis";
            case "mendesak":
                return "🟠 Mendesak";
            case "normal":
                return "🔵 Normal";
            case "santai":
                return "🟢 Santai";
            default:
                return "⚪ Belum Dijadwalkan";
        }
    };

    const formatDuration = (hours: number) => {
        if (hours < 1) {
            return `${Math.round(hours * 60)}m`;
        }
        return `${hours}h`;
    };

    const formatDateDisplay = (dateStr?: string) => {
        if (!dateStr) return "-";
        const parts = dateStr.split("-");
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return dateStr;
    };

    return (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-6">
            {/* HEADER & FILTERS */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-extrabold text-slate-900">
                            Daftar Tugas
                        </h2>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                            {tasks.length} tugas
                        </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                        Kelola dan organisasikan rencana tugas Anda.
                    </p>
                </div>

                {/* FILTER DROPDOWN */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
                    >
                        <option value="Semua">Semua Status</option>
                        <option value="Belum">Belum Selesai</option>
                        <option value="Selesai">Sudah Selesai</option>
                    </select>
                </div>
            </div>

            {/* TASK LIST OR EMPTY STATE */}
            {filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-10 text-center min-h-[220px]">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 text-3xl shadow-xs">
                        📋
                    </div>
                    <h3 className="text-base font-bold text-slate-800">
                        Tidak ada tugas ditemukan
                    </h3>
                    <p className="mt-1 text-xs text-slate-400 max-w-xs">
                        Tambahkan tugas baru atau sesuaikan filter Anda.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredTasks.map((task) => (
                        <div
                            key={task.id}
                            className={`group flex items-center justify-between gap-3 rounded-2xl border p-4 transition-all duration-200 ${
                                task.completed
                                    ? "border-slate-100 bg-slate-50/70 opacity-70"
                                    : "border-slate-200/80 bg-white shadow-xs hover:border-indigo-300 hover:shadow-md"
                            }`}
                        >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                {/* CHECKBOX */}
                                <button
                                    type="button"
                                    onClick={() => onToggle?.(task.id)}
                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                                        task.completed
                                            ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                                            : "border-slate-300 bg-white hover:border-indigo-500"
                                    }`}
                                >
                                    {task.completed && (
                                        <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
                                            <path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/>
                                        </svg>
                                    )}
                                </button>

                                {/* DETAILS */}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3
                                            className={`font-bold text-sm truncate ${
                                                task.completed
                                                    ? "line-through text-slate-400"
                                                    : "text-slate-900"
                                            }`}
                                        >
                                            {task.title}
                                        </h3>
                                    </div>

                                    {task.description && (
                                        <p className="text-xs text-slate-400 truncate mt-0.5">
                                            {task.description}
                                        </p>
                                    )}

                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                                        <span>⏱️ {formatDuration(task.duration)}</span>
                                        <span>•</span>
                                        <span>🗓️ Mulai: {formatDateDisplay(task.startDate)}</span>
                                        <span>•</span>
                                        <span>📅 Deadline: {formatDateDisplay(task.deadlineDate)}</span>
                                    </div>

                                    {/* AI URGENCY SCORE — show if available */}
                                    {task.aiUrgencyScore !== undefined && (
                                        <div className="mt-1.5 flex items-center gap-1.5">
                                            <div className="h-1 w-16 rounded-full bg-slate-100 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${
                                                        task.aiPriority === "kritis"
                                                            ? "bg-rose-500"
                                                            : task.aiPriority === "mendesak"
                                                            ? "bg-amber-500"
                                                            : task.aiPriority === "normal"
                                                            ? "bg-blue-500"
                                                            : "bg-emerald-500"
                                                    }`}
                                                    style={{ width: `${task.aiUrgencyScore}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400">
                                                Skor AI: {task.aiUrgencyScore}/100
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* RIGHT ACTIONS */}
                            <div className="flex items-center gap-2">
                                <span
                                    className={`rounded-full border px-3 py-0.5 text-xs font-bold ${getAIPriorityBadge(
                                        task.aiPriority
                                    )}`}
                                >
                                    {getAIPriorityLabel(task.aiPriority)}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => onDelete(task.id)}
                                    className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                                    title="Hapus task"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}