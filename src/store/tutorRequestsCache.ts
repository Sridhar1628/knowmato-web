export interface TutorRequest {
  request_id: number;
  doubt_id: number;
  title: string;
  description: string;
  category: string;
  preferred_explanation: string;
  status: string;
  price: number | null;
  created_at: string;

  session_id: number | null;
  session_type: string | null;
  session_status: string | null;

  student: {
    id: number;
    name: string;
  };
}

export const tutorRequestsCache = {

  requests: [] as TutorRequest[],

  loaded: false,

  loading: false,

};