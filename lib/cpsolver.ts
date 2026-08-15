import {
    Task,
    ScheduledTask,
    ScheduleResult,
    AIPriority,
} from "./types";

/**
 * ============================================================
 * CONSTRAINT PROGRAMMING SCHEDULER
 * ============================================================
 *
 * Teknik:
 * - Variable
 * - Domain
 * - Hard Constraints
 * - Backtracking Search
 * - Weighted Objective
 *
 * VARIABLE
 *   startTime setiap task
 *
 * DOMAIN
 *   Slot waktu 30 menit
 *
 * CONSTRAINT
 *   1. Tidak boleh overlap
 *   2. Tidak boleh melewati jam kerja
 *   3. Harus memenuhi startDate
 *   4. Harus memenuhi deadline
 *
 * OBJECTIVE
 *   Memaksimalkan task yang berhasil dijadwalkan
 *   dan memprioritaskan task dengan urgency tinggi.
 */

/* ============================================================
   TIME UTILITIES
   ============================================================ */

function formatTime(
    hour: number,
    minute: number = 0
): string {
    return `${String(hour).padStart(2, "0")}:${String(
        minute
    ).padStart(2, "0")}`;
}

function timeToMinutes(
    time: string
): number {
    if (!time || !time.includes(":")) {
        return 8 * 60;
    }

    const [hour, minute] = time
        .split(":")
        .map(Number);

    return (
        (hour || 0) * 60 +
        (minute || 0)
    );
}

function daysBetween(
    from: string,
    to: string
): number {
    const a = new Date(from);
    const b = new Date(to);

    return Math.round(
        (b.getTime() - a.getTime()) /
            (1000 * 60 * 60 * 24)
    );
}

/* ============================================================
   PRIORITY
   ============================================================ */

const PRIORITY_RANK: Record<
    AIPriority,
    number
> = {
    mendesak: 4,
    tinggi: 3,
    sedang: 2,
    rendah: 1,
};

/* ============================================================
   AI PRIORITY ENGINE
   ============================================================ */

export function computeAIPriority(
    startDate: string,
    deadlineDate: string
): {
    priority: AIPriority;
    score: number;
} {
    const today = new Date()
        .toISOString()
        .split("T")[0];

    const daysToDeadline =
        daysBetween(
            today,
            deadlineDate
        );

    const totalWindow =
        daysBetween(
            startDate,
            deadlineDate
        );

    /*
     * Deadline hari ini atau sudah lewat
     */
    if (daysToDeadline <= 0) {
        return {
            priority: "mendesak",
            score: 100,
        };
    }

    /* ========================================================
       ABSOLUTE URGENCY
       ======================================================== */

    let absPriority: AIPriority;
    let absScore: number;

    if (daysToDeadline <= 2) {
        absPriority = "mendesak";

        absScore = Math.round(
            85 +
                ((2 - daysToDeadline) /
                    2) *
                    15
        );
    } else if (daysToDeadline <= 5) {
        absPriority = "tinggi";

        absScore = Math.round(
            60 +
                ((5 - daysToDeadline) /
                    3) *
                    25
        );
    } else if (daysToDeadline <= 14) {
        absPriority = "sedang";

        absScore = Math.round(
            30 +
                ((14 - daysToDeadline) /
                    9) *
                    30
        );
    } else {
        absPriority = "rendah";

        absScore = Math.max(
            0,
            Math.round(
                29 -
                    (daysToDeadline -
                        14)
            )
        );
    }

    /* ========================================================
       RELATIVE URGENCY
       ======================================================== */

    if (totalWindow <= 0) {
        return {
            priority: "mendesak",
            score: 100,
        };
    }

    const fractionRemaining =
        daysToDeadline /
        totalWindow;

    let relPriority: AIPriority;
    let relScore: number;

    if (fractionRemaining < 0.15) {
        relPriority = "mendesak";

        relScore = Math.round(
            85 +
                (1 -
                    fractionRemaining /
                        0.15) *
                    15
        );
    } else if (
        fractionRemaining < 0.35
    ) {
        relPriority = "tinggi";

        relScore = Math.round(
            60 +
                ((0.35 -
                    fractionRemaining) /
                    0.2) *
                    25
        );
    } else if (
        fractionRemaining < 0.65
    ) {
        relPriority = "sedang";

        relScore = Math.round(
            30 +
                ((0.65 -
                    fractionRemaining) /
                    0.3) *
                    30
        );
    } else {
        relPriority = "rendah";

        relScore = Math.max(
            0,
            Math.round(
                (1 -
                    fractionRemaining) *
                    30
            )
        );
    }

    if (
        PRIORITY_RANK[absPriority] >=
        PRIORITY_RANK[relPriority]
    ) {
        return {
            priority: absPriority,
            score: Math.min(
                100,
                Math.max(
                    0,
                    absScore
                )
            ),
        };
    }

    return {
        priority: relPriority,
        score: Math.min(
            100,
            Math.max(0, relScore)
        ),
    };
}

/* ============================================================
   ENRICH TASK
   ============================================================ */

export function enrichTaskWithAIPriority(
    task: Task
): Task {
    const {
        priority,
        score,
    } = computeAIPriority(
        task.startDate,
        task.deadlineDate
    );

    return {
        ...task,
        aiPriority: priority,
        aiUrgencyScore: score,
    };
}

/* ============================================================
   INTERNAL CP TYPES
   ============================================================ */

type CPTask = Task & {
    aiPriority: AIPriority;
    aiUrgencyScore: number;
};

/**
 * Variable CP
 *
 * Setiap task mempunyai domain
 * berupa kemungkinan waktu mulai.
 */
interface CPVariable {
    task: CPTask;
    domain: number[];
}

/**
 * Assignment hasil pencarian CP.
 *
 * taskId menggunakan number
 * karena Task.id di types.ts adalah number.
 */
interface Assignment {
    taskId: number;
    start: number;
    end: number;
}

/**
 * Solusi CP
 */
interface CPSolution {
    assignments: Assignment[];
    score: number;
}

/**
 * Ukuran slot waktu.
 *
 * 30 menit:
 *
 * 08:00
 * 08:30
 * 09:00
 * 09:30
 */
const SLOT_SIZE = 30;

/* ============================================================
   DOMAIN GENERATOR
   ============================================================ */

/**
 * Membuat domain waktu untuk sebuah task.
 *
 * Contoh:
 *
 * Task durasi 2 jam
 *
 * Domain:
 * 08:00
 * 08:30
 * 09:00
 * 09:30
 * ...
 *
 * Setiap nilai domain adalah kandidat
 * startTime task.
 */
function generateDomain(
    task: CPTask,
    workStart: number,
    workEnd: number,
    today: string
): number[] {
    const duration =
        Math.round(
            task.duration * 60
        );

    const domain: number[] = [];

    /*
     * Task belum boleh dikerjakan
     * jika startDate masih di masa depan.
     */
    if (
        task.startDate &&
        task.startDate > today
    ) {
        return [];
    }

    /*
     * Untuk scheduler harian,
     * deadline hari ini menggunakan
     * batas akhir hari.
     */
    let latestEnd = workEnd;

    if (
        task.deadlineDate === today
    ) {
        latestEnd = Math.min(
            latestEnd,
            23 * 60 + 59
        );
    }

    /*
     * Generate semua kandidat slot.
     */
    for (
        let start = workStart;
        start + duration <=
        latestEnd;
        start += SLOT_SIZE
    ) {
        domain.push(start);
    }

    return domain;
}

/* ============================================================
   CONSTRAINT CHECKER
   ============================================================ */

/**
 * Memastikan assignment memenuhi
 * semua HARD CONSTRAINT.
 *
 * Return:
 * true  = valid
 * false = tidak valid
 */
function satisfiesConstraints(
    task: CPTask,
    start: number,
    assignments: Assignment[],
    workStart: number,
    workEnd: number,
    today: string
): boolean {
    const duration =
        Math.round(
            task.duration * 60
        );

    const end =
        start + duration;

    /* ========================================================
       CONSTRAINT 1
       Tidak boleh sebelum jam kerja
       ======================================================== */

    if (start < workStart) {
        return false;
    }

    /* ========================================================
       CONSTRAINT 2
       Tidak boleh melewati jam kerja
       ======================================================== */

    if (end > workEnd) {
        return false;
    }

    /* ========================================================
       CONSTRAINT 3
       Start date
       ======================================================== */

    if (
        task.startDate &&
        task.startDate > today
    ) {
        return false;
    }

    /* ========================================================
       CONSTRAINT 4
       Deadline
       ======================================================== */

    if (
        task.deadlineDate === today
    ) {
        const deadline =
            23 * 60 + 59;

        if (end > deadline) {
            return false;
        }
    }

    /*
     * Kalau deadline sudah lewat,
     * task tetap boleh dijadwalkan
     * karena priority engine akan
     * membuatnya sangat urgent.
     */

    /* ========================================================
       CONSTRAINT 5
       NO OVERLAP
       ======================================================== */

    for (
        const assignment of assignments
    ) {
        const overlap =
            start <
                assignment.end &&
            end >
                assignment.start;

        if (overlap) {
            return false;
        }
    }

    return true;
}

/* ============================================================
   OBJECTIVE FUNCTION
   ============================================================ */

/**
 * Objective:
 *
 * 1. Maksimalkan jumlah task
 * 2. Prioritaskan urgency tinggi
 * 3. Prioritaskan kategori urgent
 *
 * Semakin tinggi score,
 * semakin baik solusi.
 */
function calculateSolutionScore(
    assignments: Assignment[],
    taskMap: Map<number, CPTask>
): number {
    let score = 0;

    for (
        const assignment of assignments
    ) {
        const task =
            taskMap.get(
                assignment.taskId
            );

        if (!task) {
            continue;
        }

        /*
         * Bonus besar karena task berhasil
         * dijadwalkan.
         */
        score += 1000;

        /*
         * Urgency AI.
         */
        score +=
            task.aiUrgencyScore *
            10;

        /*
         * Priority rank.
         */
        score +=
            PRIORITY_RANK[
                task.aiPriority
            ] * 100;
    }

    return score;
}

/* ============================================================
   BACKTRACKING CP SOLVER
   ============================================================ */

/**
 * Backtracking Search
 *
 * Ini adalah inti Constraint Programming
 * yang digunakan pada project.
 *
 * Solver:
 *
 * Task A
 *   ├── 08:00
 *   ├── 08:30
 *   ├── 09:00
 *   └── ...
 *
 * Task B
 *   ├── 08:00
 *   ├── 08:30
 *   ├── 09:00
 *   └── ...
 *
 * Setiap kombinasi dicek terhadap
 * seluruh constraints.
 */
function solveCSP(
    variables: CPVariable[],
    taskMap: Map<number, CPTask>,
    workStart: number,
    workEnd: number,
    today: string
): CPSolution {
    let bestSolution: CPSolution = {
        assignments: [],
        score: 0,
    };

    /*
     * Batas node search.
     *
     * Mencegah browser freeze
     * jika jumlah task sangat besar.
     */
    let nodesVisited = 0;

    const MAX_NODES = 50000;

    function backtrack(
        index: number,
        assignments: Assignment[]
    ): void {
        nodesVisited++;

        if (
            nodesVisited >
            MAX_NODES
        ) {
            return;
        }

        /*
         * Semua variable selesai.
         *
         * Evaluasi objective.
         */
        if (
            index >=
            variables.length
        ) {
            const score =
                calculateSolutionScore(
                    assignments,
                    taskMap
                );

            if (
                score >
                bestSolution.score
            ) {
                bestSolution = {
                    assignments: [
                        ...assignments,
                    ],
                    score,
                };
            }

            return;
        }

        const variable =
            variables[index];

        /*
         * ====================================================
         * OPTION 1
         * ====================================================
         *
         * Task tidak dimasukkan.
         *
         * Berguna jika seluruh task
         * tidak dapat masuk ke schedule.
         */
        backtrack(
            index + 1,
            assignments
        );

        /*
         * ====================================================
         * OPTION 2
         * ====================================================
         *
         * Coba seluruh domain.
         */
        for (
            const start of
                variable.domain
        ) {
            const valid =
                satisfiesConstraints(
                    variable.task,
                    start,
                    assignments,
                    workStart,
                    workEnd,
                    today
                );

            /*
             * Constraint gagal.
             *
             * Kandidat dibuang.
             */
            if (!valid) {
                continue;
            }

            const duration =
                Math.round(
                    variable.task
                        .duration *
                        60
                );

            const assignment: Assignment =
                {
                    taskId:
                        variable.task.id,

                    start,

                    end:
                        start +
                        duration,
                };

            /*
             * Tambahkan kandidat
             * ke current solution.
             */
            assignments.push(
                assignment
            );

            /*
             * Lanjut mencari variable berikutnya.
             */
            backtrack(
                index + 1,
                assignments
            );

            /*
             * Backtracking.
             *
             * Hapus assignment
             * lalu coba kandidat berikutnya.
             */
            assignments.pop();

            if (
                nodesVisited >
                MAX_NODES
            ) {
                return;
            }
        }
    }

    /*
     * Mulai pencarian.
     */
    backtrack(0, []);

    return bestSolution;
}

/* ============================================================
   DATE DISPLAY
   ============================================================ */

function formatDateDisplay(
    dateStr: string
): string {
    if (!dateStr) {
        return "-";
    }

    const parts =
        dateStr.split("-");

    if (
        parts.length === 3
    ) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    return dateStr;
}

/* ============================================================
   REASON GENERATOR
   ============================================================ */

function buildReason(
    task: CPTask,
    rank: number,
    total: number
): string {
    const today =
        new Date()
            .toISOString()
            .split("T")[0];

    const daysToDeadline =
        daysBetween(
            today,
            task.deadlineDate
        );

    const label =
        task.aiPriority
            .charAt(0)
            .toUpperCase() +
        task.aiPriority.slice(1);

    if (
        daysToDeadline < 0
    ) {
        return (
            `⛔ Tenggat task sudah terlewat ` +
            `${Math.abs(
                daysToDeadline
            )} hari. ` +
            `CP memprioritaskan task ini. ` +
            `Urutan ${rank}/${total}. ` +
            `Skor urgensi AI: ` +
            `${task.aiUrgencyScore}/100.`
        );
    }

    if (
        task.aiPriority ===
        "mendesak"
    ) {
        return (
            `🚨 Prioritas mendesak. ` +
            `Tersisa ${daysToDeadline} hari ` +
            `menuju deadline. ` +
            `CP memilih slot yang memenuhi ` +
            `seluruh hard constraints. ` +
            `Skor urgensi AI: ` +
            `${task.aiUrgencyScore}/100.`
        );
    }

    if (
        task.aiPriority ===
        "tinggi"
    ) {
        return (
            `⚠️ Prioritas tinggi. ` +
            `Tersisa ${daysToDeadline} hari ` +
            `menuju deadline ` +
            `${formatDateDisplay(
                task.deadlineDate
            )}. ` +
            `CP memastikan task tidak overlap ` +
            `dan tetap berada dalam batas waktu. ` +
            `Skor urgensi AI: ` +
            `${task.aiUrgencyScore}/100.`
        );
    }

    if (
        task.aiPriority ===
        "sedang"
    ) {
        return (
            `ℹ️ Prioritas sedang. ` +
            `Tersisa ${daysToDeadline} hari ` +
            `menuju deadline. ` +
            `CP mencari kombinasi slot ` +
            `yang memenuhi constraints. ` +
            `Skor urgensi AI: ` +
            `${task.aiUrgencyScore}/100.`
        );
    }

    return (
        `✅ Prioritas ${label.toLowerCase()}. ` +
        `Masih tersedia ${daysToDeadline} hari ` +
        `menuju deadline. ` +
        `Task dijadwalkan jika memenuhi ` +
        `seluruh constraints. ` +
        `Skor urgensi AI: ` +
        `${task.aiUrgencyScore}/100.`
    );
}

/* ============================================================
   MAIN OPTIMIZER
   ============================================================ */

/**
 * Public function yang dipanggil
 * oleh komponen aplikasi.
 *
 * API function ini tetap:
 *
 * optimizeSchedule(...)
 *
 * Jadi file lain tidak perlu diubah.
 */
export function optimizeSchedule(
    tasks: Task[],
    workStart: string = "08:00",
    workEnd: string = "17:00"
): ScheduleResult {
    const today =
        new Date()
            .toISOString()
            .split("T")[0];

    /* ========================================================
       1. FILTER ACTIVE TASK
       ======================================================== */

    const activeTasks: CPTask[] =
        tasks
            .filter(
                (task) =>
                    !task.completed
            )
            .map((task) => {
                const {
                    priority,
                    score,
                } =
                    computeAIPriority(
                        task.startDate,
                        task.deadlineDate
                    );

                return {
                    ...task,
                    aiPriority:
                        priority,
                    aiUrgencyScore:
                        score,
                };
            });

    /* ========================================================
       2. WORKING HOURS
       ======================================================== */

    const startMinutes =
        timeToMinutes(
            workStart
        );

    const endMinutes =
        timeToMinutes(
            workEnd
        );

    /* ========================================================
       3. CREATE VARIABLES + DOMAIN
       ======================================================== */

    const variables: CPVariable[] =
        activeTasks.map(
            (task) => ({
                task,

                /*
                 * Domain:
                 * seluruh kemungkinan
                 * start time task.
                 */
                domain:
                    generateDomain(
                        task,
                        startMinutes,
                        endMinutes,
                        today
                    ),
            })
        );

    /* ========================================================
       4. VARIABLE ORDERING HEURISTIC
       ========================================================
       
       Task paling urgent diproses terlebih dahulu.
       
       Ini bukan solver-nya.
       Ini hanya heuristic untuk
       mempercepat pencarian.
       */

    variables.sort(
        (a, b) => {
            if (
                b.task
                    .aiUrgencyScore !==
                a.task
                    .aiUrgencyScore
            ) {
                return (
                    b.task
                        .aiUrgencyScore -
                    a.task
                        .aiUrgencyScore
                );
            }

            return a.task.deadlineDate.localeCompare(
                b.task.deadlineDate
            );
        }
    );

    /* ========================================================
       5. TASK MAP
       ======================================================== */

    const taskMap =
        new Map<number, CPTask>();

    for (
        const variable of variables
    ) {
        taskMap.set(
            variable.task.id,
            variable.task
        );
    }

    /* ========================================================
       6. RUN CONSTRAINT PROGRAMMING
       ======================================================== */

    const solution =
        solveCSP(
            variables,
            taskMap,
            startMinutes,
            endMinutes,
            today
        );

    /* ========================================================
       7. SORT SOLUTION BY TIME
       ======================================================== */

    const sortedAssignments =
        [
            ...solution.assignments,
        ].sort(
            (a, b) =>
                a.start - b.start
        );

    /* ========================================================
       8. CREATE SCHEDULE
       ======================================================== */

    const schedule: ScheduledTask[] =
        [];

    const scheduledIds =
        new Set<number>();

    sortedAssignments.forEach(
        (
            assignment,
            index
        ) => {
            const task =
                taskMap.get(
                    assignment.taskId
                );

            if (!task) {
                return;
            }

            scheduledIds.add(
                task.id
            );

            const startHour =
                Math.floor(
                    assignment.start /
                        60
                );

            const startMinute =
                assignment.start %
                60;

            const endHour =
                Math.floor(
                    assignment.end /
                        60
                );

            const endMinute =
                assignment.end %
                60;

            schedule.push({
                ...task,

                start: formatTime(
                    startHour,
                    startMinute
                ),

                end: formatTime(
                    endHour,
                    endMinute
                ),

                reason:
                    buildReason(
                        task,
                        index + 1,
                        sortedAssignments.length
                    ),
            });
        }
    );

    /* ========================================================
       9. SKIPPED TASKS
       ======================================================== */

    const skippedTasks =
        activeTasks.filter(
            (task) =>
                !scheduledIds.has(
                    task.id
                )
        );

    /* ========================================================
       10. ALGORITHM NOTE
       ======================================================== */

    const algorithmNote =
        `Constraint Programming (CP) — ` +
        `Backtracking Constraint Satisfaction + Weighted Objective. ` +
        `Setiap task dimodelkan sebagai variable ` +
        `startTime dengan domain berupa slot waktu ` +
        `30 menit antara ${workStart} dan ${workEnd}. ` +
        `Hard constraints yang digunakan adalah: ` +
        `task tidak boleh overlap, task tidak boleh ` +
        `berada di luar jam kerja, task harus memenuhi ` +
        `tanggal mulai, dan task harus memenuhi deadline. ` +
        `Solver menggunakan backtracking untuk mencoba ` +
        `berbagai kombinasi nilai domain dan mengecek ` +
        `setiap kombinasi terhadap seluruh constraint. ` +
        `Objective function memberikan nilai lebih tinggi ` +
        `kepada solusi yang berhasil menjadwalkan lebih ` +
        `banyak task dan task dengan urgency score lebih tinggi. ` +
        `Dengan demikian sistem melakukan constraint ` +
        `satisfaction dan optimization, bukan sekadar ` +
        `mengurutkan task berdasarkan priority.`;

    /* ========================================================
       11. RETURN
       ======================================================== */

    return {
        schedule,
        skippedTasks,
        algorithmNote,
    };
}
