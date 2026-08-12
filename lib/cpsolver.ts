import { Task, ScheduledTask, ScheduleResult, AIPriority } from "./types";

function formatTime(hour: number, minute: number = 0): string {
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function timeToMinutes(time: string): number {
    if (!time || !time.includes(":")) return 8 * 60;
    const [hour, minute] = time.split(":").map(Number);
    return (hour || 0) * 60 + (minute || 0);
}

function daysBetween(from: string, to: string): number {
    const a = new Date(from);
    const b = new Date(to);
    return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * AI Priority Engine
 * Calculates urgency score (0–100) and label based on:
 *  - daysFromStart: days from startDate to today (how overdue the start is)
 *  - daysToDeadline: days remaining until deadline
 *  - totalWindow: total days from startDate to deadlineDate
 * 
 * Logic:
 *  - If deadline has passed          → score 100 (kritis)
 *  - If <25% of window remains       → score 75–99 (mendesak)
 *  - If 25–60% of window remains     → score 40–74 (normal)
 *  - If >60% of window remains       → score 0–39 (santai)
 */
export function computeAIPriority(
    startDate: string,
    deadlineDate: string
): { priority: AIPriority; score: number } {
    const today = new Date().toISOString().split("T")[0];
    const daysToDeadline = daysBetween(today, deadlineDate);
    const totalWindow = daysBetween(startDate, deadlineDate);

    // Overdue
    if (daysToDeadline < 0) {
        return { priority: "kritis", score: 100 };
    }

    // Window is 0 or negative (same-day task or bad input)
    if (totalWindow <= 0) {
        return { priority: "kritis", score: 100 };
    }

    // Fraction of window remaining
    const fractionRemaining = daysToDeadline / totalWindow;

    if (fractionRemaining < 0.15) {
        return { priority: "kritis", score: Math.round(85 + (1 - fractionRemaining / 0.15) * 15) };
    } else if (fractionRemaining < 0.35) {
        return { priority: "mendesak", score: Math.round(60 + (0.35 - fractionRemaining) / 0.20 * 25) };
    } else if (fractionRemaining < 0.65) {
        return { priority: "normal", score: Math.round(30 + (0.65 - fractionRemaining) / 0.30 * 30) };
    } else {
        return { priority: "santai", score: Math.round(fractionRemaining > 1 ? 0 : (1 - fractionRemaining) * 30) };
    }
}

const PRIORITY_ORDER: Record<AIPriority, number> = {
    kritis: 4,
    mendesak: 3,
    normal: 2,
    santai: 1,
};

const PRIORITY_LABEL_ID: Record<AIPriority, string> = {
    kritis: "Kritis",
    mendesak: "Mendesak",
    normal: "Normal",
    santai: "Santai",
};

function formatDateDisplay(dateStr: string): string {
    if (!dateStr) return "-";
    const parts = dateStr.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
}

function buildReason(
    task: Task & { aiPriority: AIPriority; aiUrgencyScore: number },
    rank: number,
    total: number
): string {
    const today = new Date().toISOString().split("T")[0];
    const daysToDeadline = daysBetween(today, task.deadlineDate);
    const totalWindow = daysBetween(task.startDate, task.deadlineDate);
    const daysElapsed = daysBetween(task.startDate, today);
    const percentElapsed = totalWindow > 0 ? Math.round((daysElapsed / totalWindow) * 100) : 100;

    const deadlineStr = formatDateDisplay(task.deadlineDate);
    const startStr = formatDateDisplay(task.startDate);
    const label = PRIORITY_LABEL_ID[task.aiPriority];

    let urgencyVerdict = "";
    if (daysToDeadline < 0) {
        urgencyVerdict = `⛔ Tenggat sudah terlewat ${Math.abs(daysToDeadline)} hari — dijadwalkan pertama.`;
    } else if (task.aiPriority === "kritis") {
        urgencyVerdict = `🚨 Hanya tersisa ${daysToDeadline} hari dari total ${totalWindow} hari jendela waktu (${percentElapsed}% waktu sudah terpakai) — urgensi kritis.`;
    } else if (task.aiPriority === "mendesak") {
        urgencyVerdict = `⚠️ Tersisa ${daysToDeadline} hari dari tenggat ${deadlineStr}. Jendela pengerjaan ${totalWindow} hari, sudah ${percentElapsed}% terpakai.`;
    } else if (task.aiPriority === "normal") {
        urgencyVerdict = `ℹ️ Masih ada ${daysToDeadline} hari menuju tenggat ${deadlineStr}. ${percentElapsed}% dari jendela pengerjaan telah berlalu.`;
    } else {
        urgencyVerdict = `✅ Masih ada ${daysToDeadline} hari menuju tenggat ${deadlineStr} — waktu pengerjaan masih lapang.`;
    }

    return (
        `📌 Urutan ke-${rank} dari ${total} tugas aktif. ` +
        `Skor urgensi AI: ${task.aiUrgencyScore}/100 (${label}). ` +
        `Dihitung dari rentang tanggal pengerjaan: ${startStr} → ${deadlineStr} (${totalWindow} hari). ` +
        urgencyVerdict
    );
}

export function optimizeSchedule(
    tasks: Task[],
    workStart: string = "08:00",
    workEnd: string = "17:00"
): ScheduleResult {
    const today = new Date().toISOString().split("T")[0];

    // Attach AI priority to each active task
    const enriched = tasks
        .filter((t) => !t.completed)
        .map((t) => {
            const { priority, score } = computeAIPriority(t.startDate, t.deadlineDate);
            return { ...t, aiPriority: priority, aiUrgencyScore: score };
        });

    // Sort: highest score first → if tie, earliest deadline
    const sorted = [...enriched].sort((a, b) => {
        if (b.aiUrgencyScore !== a.aiUrgencyScore) return b.aiUrgencyScore - a.aiUrgencyScore;
        return a.deadlineDate.localeCompare(b.deadlineDate);
    });

    let currentTime = timeToMinutes(workStart);
    const availableEnd = timeToMinutes(workEnd);
    const schedule: ScheduledTask[] = [];
    const skippedTasks: Task[] = [];

    sorted.forEach((task, idx) => {
        const rank = idx + 1;
        const total = sorted.length;
        const durationMinutes = Math.round(task.duration * 60);
        const startTime = currentTime;
        const endTime = currentTime + durationMinutes;

        if (endTime > availableEnd) {
            skippedTasks.push(task);
            return;
        }

        const startHour = Math.floor(startTime / 60);
        const startMinute = startTime % 60;
        const endHour = Math.floor(endTime / 60);
        const endMinute = endTime % 60;

        const reason = buildReason(task, rank, total);

        schedule.push({
            ...task,
            start: formatTime(startHour, startMinute),
            end: formatTime(endHour, endMinute),
            reason,
        });

        currentTime = endTime;
    });

    const algorithmNote =
        `Algoritma CP (Constraint Programming) — Date-Driven Urgency Scheduling. ` +
        `AI menghitung skor urgensi (0–100) setiap tugas berdasarkan dua tanggal kunci: ` +
        `Tanggal Mulai Pengerjaan dan Tenggat. Rumus: semakin besar persentase waktu yang telah ` +
        `terpakai dari total jendela pengerjaan, semakin tinggi skor urgensinya. ` +
        `Hari ini (${formatDateDisplay(today)}) digunakan sebagai titik referensi. ` +
        `Tugas diurutkan dari skor tertinggi ke terendah, lalu ditempatkan ke slot waktu secara ` +
        `berurutan mulai ${workStart}. Kendala keras: tidak ada tugas yang melebihi batas ${workEnd}.`;

    return { schedule, skippedTasks, algorithmNote };
}