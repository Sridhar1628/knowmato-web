export interface PoolDoubt {
    doubt_id: number;

    title: string;

    description: string;

    category: string;

    preferred_explanation: string;

    mode: string;

    price: number;

    created_at: string;

    expires_in: number | null;

    status?: "open" | "assigned" | string;

    // Session information
    session_id?: number | null;

    session_type?:
        | "chat"
        | "audio"
        | "video_recorded"
        | "live_video"
        | string
        | null;

    session_status?:
        | "scheduled"
        | "active"
        | "completed"
        | "cancelled"
        | string
        | null;

    student: {
        id?: number;

        name: string;
    };
}


export const tutorPoolCache = {
    openDoubts: [] as PoolDoubt[],

    acceptedDoubts: [] as PoolDoubt[],

    timers: {} as Record<number, number>,

    loaded: false,

    loading: false,
};