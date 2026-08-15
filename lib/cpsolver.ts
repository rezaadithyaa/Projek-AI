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
 * Uses a HYBRID model: the higher urgency between:
 *   1. ABSOLUTE urgency — based on raw days remaining until deadline
 *   2. RELATIVE urgency — based on fraction of work window consumed
 *
 * This prevents tasks with short windows (e.g. created today, due tomorrow)
 * from being wrongly classified as "rendah" just because fractionRemaining = 1.0.
 *
 * Absolute thresholds:
 *   ≤ 2 days  → mendesak  (85–100)
 *   ≤ 5 days  → tinggi    (60–84)
 *   ≤ 14 days → sedang    (30–59)
 *   > 14 days → rendah    (0–29)
 *
 * Relative thresholds (fraction of window remaining):
 *   < 15%  → mendesak
 *   < 35%  → tinggi
 *   < 65%  → sedang
 *   ≥ 65%  → rendah
 */
const PRIORITY_RANK: Record<AIPriority, number> = { mendesak: 4, tinggi: 3, sedang: 2, rendah: 1 };

export function computeAIPriority(
    startDate: string,
    deadlineDate: string
): { priority: AIPriority; score: number } {
    const today = new Date().toISOString().split("T")[0];
    const daysToDeadline = daysBetween(today, deadlineDate);
    const totalWindow = daysBetween(startDate, deadlineDate);

    // Overdue or same-day deadline
    if (daysToDeadline <= 0) {
        return { priority: "mendesak", score: 100 };
    }

    // --- Absolute urgency (based on raw days left) ---
    let absPriority: AIPriority;
    let absScore: number;
    if (daysToDeadline <= 2) {
        absPriority = "mendesak";
        absScore = Math.round(85 + ((2 - daysToDeadline) / 2) * 15);
    } else if (daysToDeadline <= 5) {
        absPriority = "tinggi";
        absScore = Math.round(60 + ((5 - daysToDeadline) / 3) * 25);
    } else if (daysToDeadline <= 14) {
        absPriority = "sedang";
        absScore = Math.round(30 + ((14 - daysToDeadline) / 9) * 30);
    } else {
        absPriority = "rendah";
        absScore = Math.max(0, Math.round(29 - (daysToDeadline - 14)));
    }

    // --- Relative urgency (based on fraction of window consumed) ---
    // If window is invalid, fall back to absolute only
    if (totalWindow <= 0) {
        return { priority: "mendesak", score: 100 };
    }

    const fractionRemaining = daysToDeadline / totalWindow;
    let relPriority: AIPriority;
    let relScore: number;
    if (fractionRemaining < 0.15) {
        relPriority = "mendesak";
        relScore = Math.round(85 + (1 - fractionRemaining / 0.15) * 15);
    } else if (fractionRemaining < 0.35) {
        relPriority = "tinggi";
        relScore = Math.round(60 + (0.35 - fractionRemaining) / 0.20 * 25);
    } else if (fractionRemaining < 0.65) {
        relPriority = "sedang";
        relScore = Math.round(30 + (0.65 - fractionRemaining) / 0.30 * 30);
    } else {
        relPriority = "rendah";
        relScore = Math.max(0, Math.round((1 - fractionRemaining) * 30));
    }

    // Take whichever is MORE urgent
    if (PRIORITY_RANK[absPriority] >= PRIORITY_RANK[relPriority]) {
        return { priority: absPriority, score: absScore };
    } else {
        return { priority: relPriority, score: relScore };
    }
}

export function enrichTaskWithAIPriority(task: Task): Task {
    const { priority, score } = computeAIPriority(task.startDate, task.deadlineDate);
    return {
        ...task,
        aiPriority: priority,
        aiUrgencyScore: score,
    };
}


const PRIORITY_ORDER: Record<AIPriority, number> = {
    mendesak: 4,
    tinggi: 3,
    sedang: 2,
    rendah: 1,
};

const PRIORITY_LABEL_ID: Record<AIPriority, string> = {
    mendesak: "Mendesak",
    tinggi: "Tinggi",
    sedang: "Sedang",
    rendah: "Rendah",
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
    } else if (task.aiPriority === "mendesak") {
        urgencyVerdict = `🚨 Hanya tersisa ${daysToDeadline} hari dari total ${totalWindow} hari jendela waktu (${percentElapsed}% waktu sudah terpakai) — prioritas mendesak.`;
    } else if (task.aiPriority === "tinggi") {
        urgencyVerdict = `⚠️ Tersisa ${daysToDeadline} hari dari tenggat ${deadlineStr}. Jendela pengerjaan ${totalWindow} hari, sudah ${percentElapsed}% terpakai — prioritas tinggi.`;
    } else if (task.aiPriority === "sedang") {
        urgencyVerdict = `ℹ️ Masih ada ${daysToDeadline} hari menuju tenggat ${deadlineStr}. ${percentElapsed}% dari jendela pengerjaan telah berlalu — prioritas sedang.`;
    } else {
        urgencyVerdict = `✅ Masih ada ${daysToDeadline} hari menuju tenggat ${deadlineStr} — prioritas rendah.`;
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