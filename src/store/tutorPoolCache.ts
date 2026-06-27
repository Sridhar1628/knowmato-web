export interface PoolDoubt {

    doubt_id: number;

    title: string;

    description: string;

    category: string;

    preferred_explanation: string;

    mode: string;

    price: number;

    created_at: string;

    expires_in: number;

    status?: string;

    session_id?: number;

    student: {

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

