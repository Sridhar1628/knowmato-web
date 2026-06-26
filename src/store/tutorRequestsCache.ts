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