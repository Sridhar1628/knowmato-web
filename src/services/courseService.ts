import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  apiPatch,
} from "./apiService";

/* ==========================================================
   Helper
========================================================== */


const apiGetWithParams = async <T = any>(
  url: string,
  params?: Record<string, any>
) => {
  if (!params || Object.keys(params).length === 0) {
    return await apiGet(url);
  }

  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return;
    }

    queryParams.append(key, String(value));
  });

  const query = queryParams.toString();

  if (!query) {
    return await apiGet(url);
  }

  return await apiGet(`${url}?${query}`);
};

/* ==========================================================
   KNOWMATO+ LECTURE PROGRESS
========================================================== */

export interface LectureProgress {
  id: number;

  lecture: number;
  lecture_title: string;

  section_id: number;
  section_title: string;

  course_id: number;
  course_title: string;

  is_completed: boolean;

  watched_seconds: number;

  completion_percentage: number;

  first_watched_at: string | null;
  last_watched_at: string | null;

  /**
   * Number of times the student has started
   * playing this lecture.
   *
   * Added by the backend play endpoint.
   */
  play_count: number;
}


/* ==========================================================
   COURSE PROGRESS RESPONSE
========================================================== */

export interface CourseProgressLastLecture {
  id: number;
  title: string;
}

export interface CourseProgressResponse {
  enrollment_id: number;

  course_id: number;
  course_title: string;

  progress_percentage: number;

  total_lectures: number;
  completed_lectures: number;
  remaining_lectures: number;

  required_quizzes: number;
  passed_required_quizzes: number;

  course_completed: boolean;

  status: string;

  last_lecture: CourseProgressLastLecture | null;

  last_accessed_at: string | null;

  completed_at: string | null;
}


/* ==========================================================
   UPDATE LECTURE PROGRESS PAYLOAD
========================================================== */

/**
 * Backend:
 *
 * POST /v2/lecture-progress/update/
 *
 * Request:
 *
 * {
 *   "lecture_id": 1,
 *   "watched_seconds": 25
 * }
 *
 * The backend calculates:
 *
 * - completion_percentage
 * - is_completed
 */
export interface UpdateLectureProgressPayload {
  lecture_id: number;
  watched_seconds: number;
}


/* ==========================================================
   UPDATE LECTURE PROGRESS RESPONSE
========================================================== */

export interface UpdateLectureProgressResponse {
  lecture_progress: LectureProgress;

  course_progress: number;

  course_completed: boolean;
}


/* ==========================================================
   COMPLETE LECTURE RESPONSE
========================================================== */

/**
 * Backend:
 *
 * POST /v2/lecture-progress/complete/
 *
 * Request:
 *
 * {
 *   "lecture_id": 1
 * }
 */
export interface CompleteLectureResponse {
  lecture_progress: LectureProgress;

  course_progress: number;

  course_completed: boolean;
}


/* ==========================================================
   RECORD LECTURE PLAY RESPONSE
========================================================== */

/**
 * Backend:
 *
 * POST /v2/lecture-progress/play/
 *
 * Request:
 *
 * {
 *   "lecture_id": 1
 * }
 *
 * Response:
 *
 * {
 *   "lecture_progress": {...},
 *   "play_count": 2
 * }
 */
export interface RecordLecturePlayResponse {
  lecture_progress: LectureProgress;

  play_count: number;
}


/* ==========================================================
   GET MY LECTURE PROGRESS
========================================================== */

export const getLectureProgress = async (
  params?: {
    lecture?: number;
    is_completed?: boolean;
    ordering?: string;
  },
): Promise<LectureProgress[]> => {
  const response = await apiGetWithParams(
    "/v2/lecture-progress/",
    params,
  );

  /*
   * The ViewSet list endpoint returns the
   * user's lecture progress.
   */
  if (!Array.isArray(response)) {
    return [];
  }

  return response;
};


/* ==========================================================
   GET PROGRESS FOR ONE LECTURE
========================================================== */

export const getLectureProgressByLecture = async (
  lectureId: number,
): Promise<LectureProgress | null> => {
  const response = await apiGetWithParams(
    "/v2/lecture-progress/",
    {
      lecture: lectureId,
    },
  );

  if (
    !Array.isArray(response) ||
    response.length === 0
  ) {
    return null;
  }

  return response[0] ?? null;
};


/* ==========================================================
   UPDATE VIDEO PROGRESS
========================================================== */

/**
 * Backend:
 *
 * POST /v2/lecture-progress/update/
 *
 * Example:
 *
 * {
 *   lecture_id: 1,
 *   watched_seconds: 25
 * }
 *
 * IMPORTANT:
 *
 * Do NOT send:
 *
 * - completion_percentage
 * - is_completed
 *
 * The backend calculates those values.
 */

export const updateLectureProgress = async (
  lectureId: number,
  watchedSeconds: number,
): Promise<UpdateLectureProgressResponse> => {

  const safeWatchedSeconds = Math.max(
    0,
    Math.floor(
      Number(watchedSeconds) || 0,
    ),
  );

  const payload: UpdateLectureProgressPayload = {
    lecture_id: lectureId,
    watched_seconds: safeWatchedSeconds,
  };

  const response =
    await apiPost(
      "/v2/lecture-progress/update/",
      payload,
    );

  /*
   * apiPost() already returns response.data,
   * so return it directly.
   */
  return response as UpdateLectureProgressResponse;
};


/* ==========================================================
   COMPLETE LECTURE
========================================================== */

/**
 * Backend:
 *
 * POST /v2/lecture-progress/complete/
 *
 * Request:
 *
 * {
 *   lecture_id: 1
 * }
 *
 * The backend preserves the student's existing
 * watched_seconds and marks the lecture completed.
 */

export const completeLecture = async (
  lectureId: number,
): Promise<CompleteLectureResponse> => {

  const response =
    await apiPost(
      "/v2/lecture-progress/complete/",
      {
        lecture_id: lectureId,
      },
    );

  return response as CompleteLectureResponse;
};


/* ==========================================================
   RECORD LECTURE PLAY
========================================================== */

/**
 * Backend:
 *
 * POST /v2/lecture-progress/play/
 *
 * Request:
 *
 * {
 *   "lecture_id": 1
 * }
 *
 * The backend increments play_count.
 *
 * This should be called once when the student
 * actually starts playing a lecture.
 */

export const recordLecturePlay = async (
  lectureId: number,
): Promise<RecordLecturePlayResponse> => {

  const response =
    await apiPost(
      "/v2/lecture-progress/play/",
      {
        lecture_id: lectureId,
      },
    );

  return response as RecordLecturePlayResponse;
};


/* ==========================================================
   GET COURSE PROGRESS
========================================================== */

/**
 * Backend:
 *
 * GET /v2/lecture-progress/course/{courseId}/progress/
 *
 * Returns:
 *
 * - enrollment_id
 * - course_id
 * - course_title
 * - progress_percentage
 * - total_lectures
 * - completed_lectures
 * - remaining_lectures
 * - required_quizzes
 * - passed_required_quizzes
 * - course_completed
 * - status
 * - last_lecture
 * - last_accessed_at
 * - completed_at
 */

export const getCourseProgress = async (
  courseId: number,
): Promise<CourseProgressResponse> => {

  const response =
    await apiGet(
      `/v2/lecture-progress/course/${courseId}/progress/`,
    );

  /*
   * Depending on your ApiResponse/apiGet implementation,
   * response may already be the data object or may contain
   * a data property.
   */
  const data =
    response?.data ?? response;

  return data as CourseProgressResponse;
};

/* ==========================================================
   KNOWMATO+ CERTIFICATES
========================================================== */

export interface CourseCertificate {
  id: number;

  user: number;

  course: number;

  certificate_id: string;

  certificate_number: string;

  issued_at: string;

  completed_at: string;

  percentage: number;

  certificate_url: string | null;

  verification_code: string;

  is_valid: boolean;
}


/* ==========================================================
   GET MY CERTIFICATES
========================================================== */

export const getMyCertificates = async (): Promise<
  CourseCertificate[]
> => {
  return await apiGet(
    "/v2/certificates/"
  );
};


/* ==========================================================
   GET CERTIFICATE
========================================================== */

export const getCertificateById = async (
  certificateId: number
): Promise<CourseCertificate> => {
  return await apiGet(
    `/v2/certificates/${certificateId}/`
  );
};


/* ==========================================================
   GENERATE CERTIFICATE
========================================================== */

export interface GenerateCertificatePayload {
  course_id: number;
}


export const generateCertificate = async (
  courseId: number
): Promise<CourseCertificate> => {
  return await apiPost(
    "/v2/certificates/generate/",
    {
      course_id: courseId,
    }
  );
};

/* ==========================================================
   KNOWMATO+ DISCUSSION FORUM
========================================================== */


/* ==========================================================
   DISCUSSION USER
========================================================== */

export interface DiscussionUser {
  id: number;
  username: string;
  profile_picture: string | null;
}


/* ==========================================================
   DISCUSSION REPLY
========================================================== */

export interface DiscussionReply {
  id: number;

  user: DiscussionUser;

  content: string;

  created_at: string;

  updated_at: string;

  is_answer: boolean;

  parent_reply: number | null;

  can_edit: boolean;

  can_delete: boolean;

  can_mark_as_answer: boolean;

  vote_count: number;

  user_vote: "up" | "down" | null;
}


/* ==========================================================
   DISCUSSION THREAD
========================================================== */

export interface DiscussionThread {
  id: number;

  title: string;

  content: string;

  created_at: string;

  views: number;

  reply_count: number;

  unread_replies_count: number;

  is_pinned: boolean;

  is_closed: boolean;

  vote_count: number;

  user_vote: "up" | "down" | null;

  can_edit: boolean;

  can_delete: boolean;

  can_pin: boolean;

  can_close: boolean;

  latest_reply: DiscussionReply | null;

  user: DiscussionUser;
}

/* ==========================================================
   GET ALL DISCUSSIONS
========================================================== */

export const getDiscussions = async (
  params?: {
    course?: number;
    ordering?: string;
    search?: string;
  }
): Promise<DiscussionThread[]> => {
  return await apiGetWithParams(
    "/v2/discussion/",
    params
  );
};

/* ==========================================================
   GET COURSE DISCUSSIONS
========================================================== */

export const getCourseDiscussions = async (
  courseId: number
): Promise<DiscussionThread[]> => {
  return await apiGet(
    `/v2/discussion/course/${courseId}/`
  );
};

/* ==========================================================
   CREATE DISCUSSION THREAD
========================================================== */

export interface CreateDiscussionPayload {
  title: string;
  content: string;
}


export const createDiscussion = async (
  courseId: number,
  data: CreateDiscussionPayload
): Promise<DiscussionThread> => {
  return await apiPost(
    `/v2/discussion/course/${courseId}/create/`,
    data
  );
};

/* ==========================================================
   GET DISCUSSION REPLIES
========================================================== */

export const getDiscussionReplies = async (
  threadId: number
): Promise<DiscussionReply[]> => {
  return await apiGet(
    `/v2/discussion/${threadId}/replies/`
  );
};

/* ==========================================================
   CREATE DISCUSSION REPLY
========================================================== */

export interface CreateDiscussionReplyPayload {
  content: string;
  parent_reply?: number | null;
}


export const createDiscussionReply = async (
  threadId: number,
  data: CreateDiscussionReplyPayload
): Promise<DiscussionReply> => {
  return await apiPost(
    `/v2/discussion/${threadId}/reply/`,
    data
  );
};

/* ==========================================================
   UPDATE DISCUSSION REPLY
========================================================== */

export const updateDiscussionReply = async (
  replyId: number,
  content: string
): Promise<DiscussionReply> => {
  return await apiPut(
    `/v2/discussion-replies/${replyId}/`,
    {
      content,
    }
  );
};

/* ==========================================================
   DELETE DISCUSSION REPLY
========================================================== */

export const deleteDiscussionReply = async (
  replyId: number
) => {
  return await apiDelete(
    `/v2/discussion-replies/${replyId}/`
  );
};

/* ==========================================================
   VOTE DISCUSSION THREAD
========================================================== */

export interface DiscussionVotePayload {
  vote_type: "up" | "down";
}


export interface DiscussionVoteResponse {
  vote: "up" | "down" | null;

  upvotes: number;

  downvotes: number;

  vote_count: number;
}


export const voteDiscussion = async (
  threadId: number,
  voteType: "up" | "down"
): Promise<DiscussionVoteResponse> => {
  return await apiPost(
    `/v2/discussion/${threadId}/vote/`,
    {
      vote_type: voteType,
    }
  );
};

/* ==========================================================
   PIN / UNPIN DISCUSSION
========================================================== */

export const pinDiscussion = async (
  threadId: number
) => {
  return await apiPost(
    `/v2/discussion/${threadId}/pin/`,
    {}
  );
};

/* ==========================================================
   CLOSE / REOPEN DISCUSSION
========================================================== */

export const closeDiscussion = async (
  threadId: number
) => {
  return await apiPost(
    `/v2/discussion/${threadId}/close/`,
    {}
  );
};

/* ==========================================================
   VOTE DISCUSSION REPLY
========================================================== */

export const voteDiscussionReply = async (
  replyId: number,
  voteType: "up" | "down"
): Promise<DiscussionVoteResponse> => {
  return await apiPost(
    `/v2/discussion-replies/${replyId}/vote/`,
    {
      vote_type: voteType,
    }
  );
};

/* ==========================================================
   MARK REPLY AS ANSWER
========================================================== */

export const markDiscussionReplyAsAnswer = async (
  replyId: number
): Promise<DiscussionReply> => {
  return await apiPost(
    `/v2/discussion-replies/${replyId}/mark-answer/`,
    {}
  );
};

/* ==========================================================
   GET DISCUSSION BY ID
========================================================== */

export const getDiscussionById = async (
  discussionId: number
): Promise<DiscussionThread> => {
  return await apiGet(
    `/v2/discussion/${discussionId}/`
  );
};