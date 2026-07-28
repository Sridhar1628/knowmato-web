import {
  apiGet,
  apiPost,
  apiPut,
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
   LANGUAGES
========================================================== */

export interface LanguageOption {
  id: number;
  language: string;
}

export const getLanguages = async (): Promise<
  LanguageOption[]
> => {
  return await apiGet("/assessment/languages/");
};

/* ==========================================================
   ASSIGNMENTS
========================================================== */

export interface Assignment {
  id: number;
  status: string;
  time: string;
  date_of_expiry: string;
  batch: number;
  total_marks: string;
}

export interface CreateAssignmentPayload {
  status?: string;
  time?: string;
  date_of_expiry?: string;
  batch: number;
  total_marks?: string;
}

export const getAssignments = async (): Promise<
  Assignment[]
> => {
  return await apiGet(
    "/assessment/get-assignments/"
  );
};

export const createAssignment = async (
  data: CreateAssignmentPayload
) => {
  return await apiPost(
    "/assessment/assignments/",
    data
  );
};

export const updateAssignmentExpiry =
  async (
    assignmentId: number,
    data: Partial<CreateAssignmentPayload>
  ) => {
    return await apiPut(
      `/assessment/assignment/${assignmentId}/`,
      data
    );
  };

/* ==========================================================
   ASSIGNMENT DETAILS
========================================================== */

export interface ProgrammingQuestion {
  id: number;
  question: string;
  description: string;
  level: string;
  status: string;
  Assignment: number;
}

export interface MCQQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: string;
  Assignment: number;
  list: string;
  subtype: string;
}

export interface AssignmentDetails {
  assignment_id: number;
  questions: ProgrammingQuestion[];
  mcqs: MCQQuestion[];
}

export const getAssignmentDetails = async (
  assignmentId: number
): Promise<AssignmentDetails> => {
  const response = await apiGet(
    `/assessment/assignments/${assignmentId}/details/`
  );

  return response.data;
};

/* ==========================================================
   QUESTIONS
========================================================== */

export interface Question {
  id: number;
  question: string;
  description: string;
  level: string;
  status: string;
  Assignment: number;
}

export interface CreateQuestionPayload {
  question: string;
  description: string;
  level: string;
  status?: string;
  Assignment?: number;
}

export const getQuestions = async (): Promise<
  Question[]
> => {
  return await apiGet(
    "/assessment/questions/"
  );
};

export const getQuestionById =
  async (
    questionId: number
  ): Promise<Question> => {
    return await apiGet(
      `/assessment/question/?question_id=${questionId}`
    );
  };

export const createQuestion = async (
  data: CreateQuestionPayload
) => {
  return await apiPost(
    "/assessment/create-question/",
    data
  );
};

export const updateQuestion = async (id: number, data: Partial<CreateQuestionPayload>) => {
  return await apiPut(`/assessment/question/${id}/update/`, data);
};

/* ==========================================================
   TEST CASES
========================================================== */

export interface TestCase {
  id: number;
  question: number;
  input_data: string;
  expected_output: string;
}

export interface TestCaseResponse {
  question: Question;
  test_cases: TestCase[];
}

export const getTestCases = async (
  questionId: number
): Promise<TestCaseResponse> => {
  return await apiGet(
    `/assessment/test-case/${questionId}/`
  );
};

/* ==========================================================
   COMPILER
========================================================== */

export interface CompilePayload {
  language: "C" | "cpp" | "Java" | "python";
  source_code: string;
  stdin?: string;
}

export interface CompileResponse {
  output?: string;
  error?: string;
}

export const compileCode = async (
  data: CompilePayload
): Promise<CompileResponse> => {
  return await apiPost(
    "/assessment/compile/",
    data
  );
};

/* ==========================================================
   RUN TEST CASES
========================================================== */

export interface RunTestPayload {
  language: "C" | "cpp" | "Java" | "python";
  question_id: number;
  source_code: string;
  input_data?: string;
}

export interface TestCaseResult {
  test_case_id: number;
  passed: boolean;
  input: string;
  expected: string;
  output: string;
  error: string | null;
}


export interface RunTestResponse {
  passed_cases: number;
  total_cases: number;
  marks: number;
  status: "completed" | "pending";

  test_case_results: TestCaseResult[];
}

export const runTestCases = async (
  data: RunTestPayload
): Promise<RunTestResponse> => {
  return await apiPost(
    "/assessment/run-test/",
    data
  );
};

/* ==========================================================
   MCQ CATEGORIES
========================================================== */

export interface CategoryResponse {
  categories: string[];
}

export const getCategories = async (): Promise<CategoryResponse> => {
  return await apiGet("/assessment/get-category/");
};

/* ==========================================================
   MCQ SUBTYPES
========================================================== */

export interface SubtypeResponse {
  category: string;
  subtypes: string[];
}

export const getSubtypes = async (
  category: string
): Promise<SubtypeResponse> => {
  return await apiGet(
    `/assessment/get-subtype/?category=${encodeURIComponent(category)}`
  );
};

/* ==========================================================
   MCQ QUESTIONS
========================================================== */

export interface SampleQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: string;
  Assignment: number | null;
  list: string;
  subtype: string;
}

export const getQuestionsBySubtype = async (
  subtype: string
): Promise<SampleQuestion[]> => {
  return await apiGet(
    `/assessment/filter-by-subtype/?subtype=${encodeURIComponent(subtype)}`
  );
};

/* ==========================================================
   CREATE MCQ
========================================================== */

export interface CreateSamplePayload {
  question: string;
  options: string[];
  correct_answer: string;
  Assignment?: number;
  list: string;
  subtype?: string;
}

export const createSample = async (
  data: CreateSamplePayload
) => {
  return await apiPost(
    "/assessment/create-sample/",
    data
  );
};

export const getAllSamples = async (): Promise<SampleQuestion[]> => {
  return await apiGet("/assessment/samples/");
};

export const getSampleById = async (id: number): Promise<SampleQuestion> => {
  return await apiGet(`/assessment/sample/${id}/`);
};

export const updateSample = async (id: number, data: Partial<CreateSamplePayload>) => {
  return await apiPut(`/assessment/sample/${id}/update/`, data);
};

/* ==========================================================
   EVALUATE MCQ
========================================================== */

export interface EvaluateAnswersPayload {
  type: string;
  subtype: string;
  answers: Record<string, string>;
}

export interface EvaluateAnswersResponse {
  user_id: number;
  type: string;
  subtype: string;
  total_correct: number;
  total_questions: number;
  percentage: number;
}

export const evaluateAnswers = async (
  data: EvaluateAnswersPayload
): Promise<EvaluateAnswersResponse> => {
  return await apiPost(
    "/assessment/evaluate/",
    data
  );
};

/* ==========================================================
   MCQ STATUS
========================================================== */

export interface MCQStatus {
  id: number;
  user: number;
  marks: string;
  subtype: string;
  type: string;
  status: string;
  created_at: string;
}

export const getCompletedMCQs = async (): Promise<
  MCQStatus[]
> => {
  return await apiGet(
    "/assessment/filter-mcq-status/"
  );
};

/* ==========================================================
   PROGRAMMING MARKS
========================================================== */

export interface ProgrammingMark {
  id: number;
  user: number;
  question: number;
  marks: string;
  status: string;
  created_at: string;
}

export const getProgrammingMarks = async (): Promise<
  ProgrammingMark[]
> => {
  return await apiGet(
    "/assessment/get-marks/"
  );
};

/* ==========================================================
   MARKS BY DATE RANGE
========================================================== */

export interface DateRangePayload {
  start_date: string;
  end_date: string;
}

export const getProgrammingMarksByDate = async (
  params: DateRangePayload
): Promise<ProgrammingMark[]> => {
  return await apiGetWithParams(
    "/assessment/marks/date-range/",
    params
  );
};

/* ==========================================================
   MCQ MARKS
========================================================== */

export interface MCQMark {
  id: number;
  user: number;
  marks: string;
  subtype: string;
  type: string;
  status: string;
  created_at: string;
}

export const getMCQMarks = async (): Promise<
  MCQMark[]
> => {
  return await apiGet(
    "/assessment/mcq-marks/"
  );
};

/* ==========================================================
   AVERAGE PROGRAM MARKS
========================================================== */

export interface AverageMarksResponse {
  user_id: number;
  avg_marks: number | null;
}

export const getAverageProgramMarks =
  async (): Promise<AverageMarksResponse> => {
    return await apiGet(
      "/assessment/average-program/"
    );
  };

/* ==========================================================
   AVERAGE MCQ MARKS
========================================================== */

export const getAverageMCQMarks =
  async (): Promise<AverageMarksResponse> => {
    return await apiGet(
      "/assessment/average-mcq/"
    );
  };

/* ==========================================================
   TOPICS
========================================================== */

export interface Syllabus {
  id: number;
  language: number;
  topics: string;
}

export interface TopicsResponse {
  topics: Syllabus[];
}

export const getTopics =
  async (): Promise<TopicsResponse> => {
    return await apiGet(
      "/assessment/topics/"
    );
  };

/* ==========================================================
   CONTENT
========================================================== */

export interface BaseTest {
  id: number;
  language: number | null;
  title: string;
  content: string;
  question: string;
  description: string;
  input_data: string;
  expected_output: string;
  level: string;
  position: string;
}

export const getContent =
  async (): Promise<BaseTest[]> => {
    return await apiGet(
      "/assessment/content/"
    );
  };

/* ==========================================================
   ADMIN MARKS
========================================================== */
// ---------- Admin Results Interfaces ----------

export interface AdminProgrammingMark {
  id: number;
  user: number;
  user_name: string;          // email or display name
  question: number;
  question_text: string;      // truncated question text
  marks: string;
  status: string;
  created_at: string;
  assignment_id?: number;
}

export interface AdminMCQMark {
  id: number;
  user: number;
  user_name: string;
  type: string;
  subtype: string;
  marks: string;
  status: string;
  created_at: string;
}

// ---------- Admin Service Functions ----------

export const getAdminProgrammingMarks = async (
  params?: { assignment_id?: number; user_search?: string }
): Promise<AdminProgrammingMark[]> => {
  return await apiGetWithParams("/assessment/admin/programming-marks/", params);
};

export const getAdminMCQMarks = async (
  params?: { assignment_id?: number; user_search?: string }
): Promise<AdminMCQMark[]> => {
  return await apiGetWithParams("/assessment/admin/mcq-marks/", params);
};








/* ==========================================================
   NEW ASSESSMENT ENGINE
========================================================== */

/* ============================
   Attempt
============================ */

export interface StartAssessmentResponse {
  id: number;
  assignment: number;
  attempt_number: number;
  status: string;
  started_at: string;
  submitted_at: string | null;
  mcq_score: number;
  programming_score: number;
  total_marks: number;
  percentage: number;
  is_passed: boolean;
  is_locked: boolean;
  resume: boolean;
  is_new: boolean;
}

export const startAssessment = async (
  assignmentId: number
): Promise<StartAssessmentResponse> => {
  return await apiPost(
    `/assessment/assignments/${assignmentId}/start/`,
    {}
  );
};

export const getAttemptDetails = async (
  attemptId: number
) => {
  return await apiGet(
    `/assessment/attempts/${attemptId}/`
  );
};

/* ============================
   MCQ
============================ */

export interface SaveMCQAnswerPayload {
  question_id: number;
  selected_option_id: number;
}

export const saveMCQAnswer = async (
  attemptId: number,
  data: SaveMCQAnswerPayload
) => {
  return await apiPost(
    `/assessment/attempts/${attemptId}/mcq/save/`,
    data
  );
};

export const getSavedMCQAnswers = async (
  attemptId: number
) => {
  return await apiGet(
    `/assessment/attempts/${attemptId}/mcq/answers/`
  );
};

/* ============================
   Programming
============================ */

export interface SaveProgrammingCodePayload {
  question_id: number;
  language: string;
  source_code: string;
}

export const saveProgrammingCode = async (
  attemptId: number,
  data: SaveProgrammingCodePayload
) => {
  return await apiPost(
    `/assessment/attempts/${attemptId}/programming/save/`,
    data
  );
};

export const getSavedProgrammingCode = async (
  attemptId: number
) => {
  return await apiGet(
    `/assessment/attempts/${attemptId}/programming/code/`
  );
};

/* ============================
   Submit
============================ */

export const submitAssessment = async (
  attemptId: number
) => {
  return await apiPost(
    `/assessment/attempts/${attemptId}/submit/`,
    {}
  );
};

/* ============================
   Result
============================ */

export const getAssessmentResult = async (
  attemptId: number
) => {
  return await apiGet(
    `/assessment/attempts/${attemptId}/result/`
  );
};

/* ============================
   Review
============================ */

export const getAssessmentReview = async (
  attemptId: number
) => {
  return await apiGet(
    `/assessment/attempts/${attemptId}/review/`
  );
};

export const getMCQReview = async (
  attemptId: number
) => {
  return await apiGet(
    `/assessment/attempts/${attemptId}/review/mcq/`
  );
};

export const getProgrammingReview = async (
  attemptId: number
) => {
  return await apiGet(
    `/assessment/attempts/${attemptId}/review/programming/`
  );
};

/* ============================
   Analytics
============================ */

export const getAssessmentAnalytics = async (
  attemptId: number
) => {
  return await apiGet(
    `/assessment/attempts/${attemptId}/analytics/`
  );
};

/* ============================
   Student Dashboard
============================ */

export const getStudentDashboard = async () => {
  return await apiGet(
    "/assessment/student/dashboard/"
  );
};

export const getQuizQuestions = async (quizId: number) => {
  return await apiGet(`/assessment/quizzes/${quizId}/questions/`);
};

export interface AdminAssignment {
  id: number;
  status: string;
  time: string | null;
  date_of_expiry: string;
  batch: number;
  batch_name: string;
  total_marks: string | null;
}

export const getAdminAssignments = async (): Promise<AdminAssignment[]> => {
  return await apiGet('/assessment/admin/assignments/');
};

// ---------- Admin assignment detail ----------
export interface AdminAssignmentDetail {
  id: number;
  status: string;
  time: string | null;
  date_of_expiry: string;
  batch: number;
  total_marks: string | null;
  programming_questions: {
    id: number;
    question: string;
    level: string;
    status: string;
    description: string | null;
  }[];
  mcq_quizzes: {
    id: number;
    title: string;
    category: string;
    subtype: string | null;
    total_marks: number;
    is_active: boolean;
  }[];
}

export const getAdminAssignmentDetail = async (
  assignmentId: number
): Promise<AdminAssignmentDetail> => {
  return await apiGet(`/assessment/admin/assignments/${assignmentId}/`);
};

// ---------- Admin: update assignment ----------
export interface UpdateAssignmentPayload {
  batch?: number;
  total_marks?: string;
  date_of_expiry: string;
  time?: string;
  status?: string;
}

export const updateAdminAssignment = async (
  assignmentId: number,
  payload: UpdateAssignmentPayload
) => {
  return await apiPut(`/assessment/admin/assignments/${assignmentId}/`, payload);
};

// ---------- Admin: create assignment ----------
export interface CreateAdminAssignmentPayload {
  batch: number;           // Batch ID (foreign key)
  total_marks?: string;    // optional max score
  date_of_expiry: string;  // YYYY-MM-DD
  time?: string;           // HH:MM
  status?: string;         // "Active" | "Expired"
}

export const createAdminAssignment = async (payload: CreateAdminAssignmentPayload) => {
  return await apiPost('/assessment/admin/assignments/new/', payload);
};

// ---------- Admin: list attempts ----------
export interface AdminAttemptSummary {
  id: number;
  assignment: number;        // assignment id
  user: number;              // user id
  programming_score: number;
  mcq_score: number;
  total_marks: number;
  percentage: number;
  status: string;            // "in_progress", "submitted", "expired"
  submitted_at: string | null;
  created_at: string;
}

export const getAdminAttempts = async (params?: {
  assignment_id?: number;
}): Promise<AdminAttemptSummary[]> => {
  // Adjust the URL to your admin attempts list endpoint.
  const query = params?.assignment_id
    ? `?assignment_id=${params.assignment_id}`
    : '';
  return await apiGet(`/assessment/admin/attempts/${query}`);
};

// ---------- Admin: quizzes ----------
export interface AdminQuizSummary {
  id: number;
  title: string;
  description: string;
  category: string;
  subtype: string | null;
  assignment: number;          // assignment id
  total_marks: number;
  duration_minutes: number;
  is_active: boolean;
  question_count?: number;     // optional, add if backend provides it
}

export const getAdminQuizzes = async (): Promise<AdminQuizSummary[]> => {
  return await apiGet('/assessment/admin/quizzes/');
};

// ---------- Admin quiz detail ----------
export interface AdminQuizDetail {
  id: number;
  assignment: number | null;
  title: string;
  description: string;
  category: string;
  subtype: string | null;
  passing_percentage: number;
  duration_minutes: number;
  total_marks: number;
  is_active: boolean;
  status: string;
}

export const getAdminQuizById = async (quizId: number): Promise<AdminQuizDetail> => {
  return await apiGet(`/assessment/admin/quizzes/${quizId}/`);
};

export const updateAdminQuiz = async (
  quizId: number,
  payload: Partial<AdminQuizDetail>
) => {
  return await apiPut(`/assessment/admin/quizzes/${quizId}/`, payload);
};

// ---------- Admin: create quiz ----------
export interface CreateAdminQuizPayload {
  assignment?: number;        // assignment id (optional)
  title: string;
  description?: string;
  category: string;           // "Technical", "SoftSkill", "Aptitude"
  subtype?: string;
  passing_percentage: number;
  duration_minutes: number;
  total_marks: number;
  is_active: boolean;
  status: string;             // "draft", "published", "archived"
}

export const createAdminQuiz = async (payload: CreateAdminQuizPayload) => {
  return await apiPost('/assessment/admin/quizzes/new/', payload);
};

// ---------- Admin question (programming) ----------
export interface AdminQuestionDetail {
  id: number;
  question: string;
  description: string | null;
  level: string;
  status: string;
  assignment: number | null; // assignment id
}

export const getAdminQuestionById = async (questionId: number): Promise<AdminQuestionDetail> => {
  return await apiGet(`/assessment/admin/questions/${questionId}/`);
};

export interface UpdateAdminQuestionPayload {
  question?: string;
  description?: string | null;
  level?: string;
  status?: string;
  assignment?: number | null;
}

export const updateAdminQuestion = async (
  questionId: number,
  payload: UpdateAdminQuestionPayload
) => {
  return await apiPut(`/assessment/admin/questions/${questionId}/update/`, payload);
};

export interface CreateAdminQuestionPayload {
  question: string;
  description?: string;
  level: string;
  status?: string;
  assignment?: number | null;
}

export const createAdminQuestion = async (payload: CreateAdminQuestionPayload) => {
  return await apiPost('/assessment/admin/questions/new/', payload);
};

// ---------- Admin questions list ----------
export interface AdminQuestionListItem {
  id: number;
  question: string;
  description: string | null;
  level: string;
  status: string;
  assignment: number | null; // assignment ID
}

export const getAdminQuestions = async (): Promise<AdminQuestionListItem[]> => {
  return await apiGet('/assessment/admin/questions/');
};

// ---------- Admin attempts (results) ----------
export interface AdminAttemptSummary {
  id: number;
  user: number;             // user ID
  user_name?: string;       // optional (backend should include)
  assignment: number;       // assignment ID
  programming_score: number;
  mcq_score: number;
  total_marks: number;
  percentage: number;
  status: string;           // "submitted", "in_progress", "expired"
  submitted_at: string | null;
  created_at: string;
}

// ---------- Admin test cases ----------
export interface AdminTestCase {
  id: number;
  question: number;         // question ID
  input_data: string | null;
  expected_output: string;
}

export const getAdminTestCases = async (questionId: number): Promise<AdminTestCase[]> => {
  return await apiGet(`/assessment/admin/questions/${questionId}/testcases/`);
};

export const createAdminTestCase = async (
  questionId: number,
  payload: { input_data?: string; expected_output: string }
) => {
  return await apiPost(`/assessment/admin/questions/${questionId}/testcases/new/`, payload);
};

export const updateAdminTestCase = async (
  testCaseId: number,
  payload: { input_data?: string; expected_output: string }
) => {
  return await apiPut(`/assessment/admin/testcases/${testCaseId}/update/`, payload);
};

export const deleteAdminTestCase = async (testCaseId: number) => {
  // apiDelete is not in your services file, but you can implement it similarly to apiPost/apiPut.
  // For now, use apiPost with DELETE method or add apiDelete.
  // We'll assume you have a generic apiDelete or just use fetch.
  // Here's a simple implementation:
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/assessment/admin/testcases/${testCaseId}/delete/`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Deletion failed');
  return response.json();
};