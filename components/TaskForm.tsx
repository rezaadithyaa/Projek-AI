"use client";

import { FormEvent, useState } from "react";
import { Task } from "@/lib/types";

type TaskFormProps = {
    onAddTask: (task: Task) => void;
};

export default function TaskForm({ onAddTask }: TaskFormProps) {
    const todayStr = new Date().toISOString().split("T")[0];

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState(todayStr);
    const [deadlineDate, setDeadlineDate] = useState(todayStr);
    const [durationMinutes, setDurationMinutes] = useState(30);

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!title.trim()) {
            return;
        }

        const task: Task = {
            id: Date.now(),
            title: title.trim(),
            description: description.trim() || undefined,
            duration: durationMinutes / 60, // convert to hours
            startDate: startDate || todayStr,
            deadlineDate: deadlineDate || todayStr,
            completed: false,
        };

        onAddTask(task);

        // Reset form
        setTitle("");
        setDescription("");
        setStartDate(todayStr);
        setDeadlineDate(todayStr);
        setDurationMinutes(30);
    }

    const formatDurationDisplay = (mins: number) => {
        if (mins < 60) return `${mins} menit`;
        const hours = mins / 60;
        return `${hours} jam`;
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-6"
        >
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                    <span className="h-3 w-3 rounded-full bg-blue-600 animate-pulse" />
                    <h2 className="text-lg font-extrabold text-slate-900">
                        Buat Tugas Baru
                    </h2>
                </div>

                <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700 border border-purple-100">
                    Terintegrasi AI
                </span>
            </div>

            <div className="space-y-5">
                {/* JUDUL TUGAS */}
                <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                        JUDUL TUGAS <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="contoh: Menyusun Laporan Keuangan Kuartal 3"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                        required
                    />
                </div>

                {/* DESKRIPSI (Opsional) */}
                <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                        DESKRIPSI <span className="text-slate-400 font-normal">(Opsional)</span>
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Tambahkan subtugas atau catatan spesifik..."
                        rows={2}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 resize-none"
                    />
                </div>

                {/* TANGGAL MULAI & TENGGAT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                            TANGGAL MULAI 🗓️
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 cursor-pointer"
                        />
                        <p className="mt-1 text-[11px] text-slate-400">Kapan kamu mulai mengerjakan?</p>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                            TENGGAT TANGGAL 📅
                        </label>
                        <input
                            type="date"
                            value={deadlineDate}
                            onChange={(e) => setDeadlineDate(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 cursor-pointer"
                        />
                        <p className="mt-1 text-[11px] text-slate-400">Batas waktu penyelesaian.</p>
                    </div>
                </div>

                {/* AI PRIORITY INFO BANNER */}
                <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">
                    <span className="text-indigo-500 text-base mt-0.5">🤖</span>
                    <div>
                        <p className="text-xs font-bold text-indigo-800">Prioritas Dihitung Otomatis oleh AI</p>
                        <p className="text-[11px] text-indigo-600 mt-0.5 leading-relaxed">
                            AI akan menghitung skor urgensi (0–100) berdasarkan rentang tanggal mulai → tenggat secara otomatis saat kamu menekan Optimasi Jadwal.
                        </p>
                    </div>
                </div>

                {/* PERKIRAAN DURASI SLIDER */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            PERKIRAAN DURASI
                        </label>
                        <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-extrabold text-indigo-700">
                            {formatDurationDisplay(durationMinutes)}
                        </span>
                    </div>

                    <input
                        type="range"
                        min={15}
                        max={240}
                        step={15}
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />

                    <div className="flex justify-between text-[11px] font-medium text-slate-400 mt-1">
                        <span>15m</span>
                        <span>1h</span>
                        <span>2h</span>
                        <span>3h</span>
                        <span>4h</span>
                    </div>
                </div>

                {/* SUBMIT BUTTON */}
                <button
                    type="submit"
                    className="w-full rounded-2xl bg-[#18181b] px-6 py-4 text-sm font-bold text-white shadow-xl shadow-slate-900/10 transition hover:bg-slate-800 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                    + Tambahkan ke Daftar Tugas
                </button>
            </div>
        </form>
    );
}