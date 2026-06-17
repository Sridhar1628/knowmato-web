// src/store/myDoubtsCache.ts

export interface CachedDoubt {
  doubt_id: number;
  title: string;
  category: string;
  preferred_explanation: "text" | "live_video";
  status: "completed" | "open" | "assigned";
  price: number | null;
  mode: "pool" | "specific";
  created_at: string;
  tutor_id: number;
  tutor: string | null;
  session: any;
  review: any;
}

export const myDoubtsCache = {
  doubts: [] as CachedDoubt[],
  nextPageUrl: null as string | null,
  totalCount: 0,
  initialized: false,
};