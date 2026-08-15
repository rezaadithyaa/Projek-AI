// Priority is now determined internally by the AI based on date calculations.
// It is NOT exposed to the user.
export type AIPriority = "mendesak" | "tinggi" | "sedang" | "rendah";

export interface Task {
    id: number;
    title: string;
    description?: string;
    category?: string;
    duration: number;       // in hours (e.g. 0.5, 1, 2)
    startDate: string;      // YYYY-MM-DD: when the user plans to start working
    deadlineDate: string;   // YYYY-MM-DD: hard deadline
    aiPriority?: AIPriority; // computed by AI, not set by user
    aiUrgencyScore?: number; // 0–100 score computed by AI
    completed: boolean;
}

export interface ScheduledTask extends Task {
    start: string;   // HH:MM slot start
    end: string;     // HH:MM slot end
    reason?: string; // AI-generated explanation
}

export interface ScheduleResult {
    schedule: ScheduledTask[];
    skippedTasks: Task[];
    algorithmNote: string;
}

export interface WorkHours {
    start: string; // e.g. "08:00"
    end: string;   // e.g. "17:00"
}

export interface SuggestedTask {
    title: string;
    description?: string;
    category?: string;
    duration: number; // in hours
    startDate: string;
    deadlineDate: string;
}

export interface ChatMessage {
    id: string;
    sender: "user" | "ai";
    text: string;
    timestamp: string;
    suggestedTask?: SuggestedTask;
}