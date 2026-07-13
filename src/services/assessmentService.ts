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
  total_score: string;
}

export interface CreateAssignmentPayload {
  status?: string;
  time?: string;
  date_of_expiry?: string;
  batch: number;
  total_score?: string;
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

export const getAssignmentDetails =
  async (
    assignmentId: number
  ): Promise<AssignmentDetails> => {
    return await apiGet(
      `/assessment/assignments/${assignmentId}/details/`
    );
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