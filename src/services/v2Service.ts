import axiosInstance from '../api/axiosInstance';



// ==========================================
// KnowMato+
// ==========================================

export interface KnowMatoPlusResponse {
  success: boolean;
  message?: string;
  is_knowmato_plus: boolean;
}

/**
 * Get KnowMato+ status
 */
export const getKnowMatoPlusStatus = async (): Promise<KnowMatoPlusResponse> => {
  const response = await axiosInstance.get<KnowMatoPlusResponse>(
    "/v1/student/knowmato-plus/"
  );

  return response.data;
};

/**
 * Enable / Disable KnowMato+
 */
export const updateKnowMatoPlusStatus = async (
  is_knowmato_plus: boolean
): Promise<KnowMatoPlusResponse> => {
  const response = await axiosInstance.post<KnowMatoPlusResponse>(
    "/v1/student/knowmato-plus/",
    {
      is_knowmato_plus,
    }
  );

  return response.data;
};

// ======================================================
// CATEGORY TYPES
// ======================================================

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  banner: string;
  color: string;
  display_order: number;
  is_active: boolean;
  total_courses: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryPayload {
  name: string;
  description?: string;
  icon?: string;
  banner?: string;
  color?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  banner: string;
  color: string;
  display_order: number;
  total_courses: number;
}

export interface Course {
  id: number;

  title: string;
  slug: string;
  subtitle: string;
  description: string;

  thumbnail: string;
  trailer_video: string;

  language: string;

  difficulty:
    | "beginner"
    | "intermediate"
    | "advanced";

  course_type:
    | "free"
    | "paid"
    | "premium";

  price: number;
  discounted_price: number;

  duration_hours: number;

  total_sections: number;
  total_lectures: number;
  total_quizzes: number;
  total_students: number;

  average_rating: number;
  total_reviews: number;

  prerequisites: string;
  learning_outcomes: string;
  target_audience: string;

  certificate_available: boolean;

  is_featured: boolean;
  is_trending: boolean;

  course_credit_cost: number;

  category: number;
  category_name?: string;

  instructor: number;
  instructor_name?: string;

  created_at: string;
  updated_at: string;
}

export const getCourses = async (
  params?: {
    search?: string;
    ordering?: string;
    category?: number;
    page?: number;
  }
): Promise<Course[]> => {

  const response = await axiosInstance.get(
    "/v2/courses/",
    {
      params,
    }
  );

  return response.data;
};

export const getCourse = async (
  id: number
): Promise<Course> => {

  const response = await axiosInstance.get(
    `/v2/courses/${id}/`
  );

  return response.data;
};

export const createCourse = async (
  data: Partial<Course>
): Promise<Course> => {

  const response = await axiosInstance.post(
    "/v2/courses/",
    data
  );

  return response.data;
};

export const updateCourse = async (
  id: number,
  data: Partial<Course>
): Promise<Course> => {

  const response = await axiosInstance.patch(
    `/v2/courses/${id}/`,
    data
  );

  return response.data;
};

export const deleteCourse = async (
  id: number
): Promise<void> => {

  await axiosInstance.delete(
    `/v2/courses/${id}/`
  );
};

export const getFeaturedCourses =
  async (): Promise<Course[]> => {

    const response = await axiosInstance.get(
      "/v2/courses/",
      {
        params: {
          is_featured: true,
        },
      }
    );

    return response.data;
};

export const getTrendingCourses =
  async (): Promise<Course[]> => {

    const response = await axiosInstance.get(
      "/v2/courses/",
      {
        params: {
          is_trending: true,
        },
      }
    );

    return response.data;
};

export const getFreeCourses =
  async (): Promise<Course[]> => {

    const response = await axiosInstance.get(
      "/v2/courses/",
      {
        params: {
          course_type: "free",
        },
      }
    );

    return response.data;
};

export const getPremiumCourses =
  async (): Promise<Course[]> => {

    const response = await axiosInstance.get(
      "/v2/courses/",
      {
        params: {
          course_type: "premium",
        },
      }
    );

    return response.data;
};

export const searchCourses =
  async (
    query: string
  ): Promise<Course[]> => {

    const response = await axiosInstance.get(
      "/v2/courses/",
      {
        params: {
          search: query,
        },
      }
    );

    return response.data;
};

// ==========================================
// SECTION
// ==========================================

export interface Section {

    id: number;

    course: number;

    course_title?: string;

    title: string;

    description: string;

    thumbnail: string;

    order: number;

    duration_minutes: number;

    total_lectures: number;

    total_quizzes: number;

    is_preview: boolean;

    is_active: boolean;

    created_at: string;

    updated_at: string;
}

export const getSections = async (
    params?: {
        course?: number;
        is_active?: boolean;
        is_preview?: boolean;
        ordering?: string;
    },
): Promise<Section[]> => {

    const response = await axiosInstance.get(
        "/v2/sections/",
        {
            params,
        },
    );

    return response.data;
};

export const getSection = async (
    id: number,
): Promise<Section> => {

    const response = await axiosInstance.get(
        `/v2/sections/${id}/`,
    );

    return response.data;
};

export const createSection = async (
    data: Partial<Section>,
): Promise<Section> => {

    const response = await axiosInstance.post(
        "/v2/sections/",
        data,
    );

    return response.data;
};

export const updateSection = async (
    id: number,
    data: Partial<Section>,
): Promise<Section> => {

    const response = await axiosInstance.patch(
        `/v2/sections/${id}/`,
        data,
    );

    return response.data;
};

export const deleteSection = async (
    id: number,
): Promise<void> => {

    await axiosInstance.delete(
        `/v2/sections/${id}/`,
    );
};

export const getCourseSections = async (
    courseId: number,
): Promise<Section[]> => {

    const response = await axiosInstance.get(
        "/v2/sections/",
        {
            params: {
                course: courseId,
            },
        },
    );

    return response.data;
};

export interface ReorderSectionRequest {
    id: number;
    order: number;
}

export const reorderSections = async (
    courseId: number,
    sections: ReorderSectionRequest[],
): Promise<any> => {

    const response = await axiosInstance.post(
        `/v2/courses/${courseId}/reorder-sections/`,
        {
            sections,
        },
    );

    return response.data;
};

// ==========================================
// Lecture
// ==========================================

export interface Lecture {
  id: number;

  section: number;
  section_title?: string;

  course_id?: number;
  course_title?: string;

  title: string;
  description: string;

  order: number;

  content_type:
    | "video"
    | "pdf"
    | "article"
    | "assignment"
    | "resource";

  video_url: string;
  video_duration: number;

  pdf_url: string;

  article_content: string;

  resource_url: string;
  resource_name: string;

  thumbnail: string;

  is_preview: boolean;
  is_downloadable: boolean;
  is_active: boolean;

  created_at: string;
  updated_at: string;
}

export const getLectures = async (
  params?: {
    section?: number;
    content_type?: string;
    search?: string;
    ordering?: string;
    is_preview?: boolean;
    is_downloadable?: boolean;
  }
): Promise<Lecture[]> => {

  const response = await axiosInstance.get(
    "/v2/lectures/",
    {
      params,
    }
  );

  return response.data;
};

export const getLecture = async (
  id: number
): Promise<Lecture> => {

  const response = await axiosInstance.get(
    `/v2/lectures/${id}/`
  );

  return response.data;
};

export const createLecture = async (
  data: Partial<Lecture>
): Promise<Lecture> => {

  const response = await axiosInstance.post(
    "/v2/lectures/",
    data
  );

  return response.data;
};

export const updateLecture = async (
  id: number,
  data: Partial<Lecture>
): Promise<Lecture> => {

  const response = await axiosInstance.patch(
    `/v2/lectures/${id}/`,
    data
  );

  return response.data;
};

export const deleteLecture = async (
  id: number
): Promise<void> => {

  await axiosInstance.delete(
    `/v2/lectures/${id}/`
  );
};

export const getSectionLectures = async (
  sectionId: number
): Promise<Lecture[]> => {

  const response = await axiosInstance.get(
    "/v2/lectures/",
    {
      params: {
        section: sectionId,
      },
    }
  );

  return response.data;
};

export const searchLectures = async (
  search: string
): Promise<Lecture[]> => {

  const response = await axiosInstance.get(
    "/v2/lectures/",
    {
      params: {
        search,
      },
    }
  );

  return response.data;
};

export const getVideoLectures = async (): Promise<Lecture[]> => {

  const response = await axiosInstance.get(
    "/v2/lectures/",
    {
      params: {
        content_type: "video",
      },
    }
  );

  return response.data;
};

export const getPdfLectures = async (): Promise<Lecture[]> => {

  const response = await axiosInstance.get(
    "/v2/lectures/",
    {
      params: {
        content_type: "pdf",
      },
    }
  );

  return response.data;
};

export const getPreviewLectures = async (): Promise<Lecture[]> => {

  const response = await axiosInstance.get(
    "/v2/lectures/",
    {
      params: {
        is_preview: true,
      },
    }
  );

  return response.data;
};

export const getDownloadableLectures = async (): Promise<Lecture[]> => {

  const response = await axiosInstance.get(
    "/v2/lectures/",
    {
      params: {
        is_downloadable: true,
      },
    }
  );

  return response.data;
};

// ==========================================
// Lecture Progress
// ==========================================

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

    first_watched_at: string;
    last_watched_at: string;
}

export const getLectureProgress = async () => {

    const response = await axiosInstance.get<LectureProgress[]>(
        "/v2/lecture-progress/"
    );

    return response.data;
};

export const getLectureProgressByLecture = async (
    lectureId: number
) => {

    const response = await axiosInstance.get<LectureProgress[]>(
        "/v2/lecture-progress/",
        {
            params: {
                lecture: lectureId,
            },
        }
    );

    return response.data;
};

export const updateLectureProgress = async (
    id: number,
    data: Partial<LectureProgress>
) => {

    const response = await axiosInstance.patch<LectureProgress>(
        `/v2/lecture-progress/${id}/`,
        data,
    );

    return response.data;
};

export const createLectureProgress = async (
    data: Partial<LectureProgress>
) => {

    const response = await axiosInstance.post<LectureProgress>(
        "/v2/lecture-progress/",
        data,
    );

    return response.data;
};

export const markLectureCompleted = async (
    id: number
) => {

    const response = await axiosInstance.patch<LectureProgress>(
        `/v2/lecture-progress/${id}/`,
        {
            is_completed: true,
            completion_percentage: 100,
        },
    );

    return response.data;
};

export const updateWatchTime = async (
    id: number,
    watched_seconds: number,
    completion_percentage: number
) => {

    const response = await axiosInstance.patch<LectureProgress>(
        `/v2/lecture-progress/${id}/`,
        {
            watched_seconds,
            completion_percentage,
        },
    );

    return response.data;
};

// =====================================================
// ENROLLMENT
// =====================================================

export interface Enrollment {

    id: number;

    course: number;

    course_title: string;

    course_slug: string;

    course_thumbnail: string;

    instructor_name: string;

    status:
        | "active"
        | "completed"
        | "cancelled"
        | "expired";

    progress_percentage: number;

    last_lecture: number | null;

    last_lecture_title: string | null;

    certificate_generated: boolean;

    enrolled_at: string;

    last_accessed_at: string | null;
}

export const purchaseCourse = async (
    courseId: number
) => {

    const response = await axiosInstance.post(
        "/v2/enrollments/purchase/",
        {
            course_id: courseId,
        }
    );

    return response.data;
};

export const getMyCourses = async () => {

    const response = await axiosInstance.get<Enrollment[]>(
        "/v2/enrollments/my-courses/"
    );

    return response.data;
};

export const getEnrollment = async (
    id: number
) => {

    const response = await axiosInstance.get<Enrollment>(
        `/v2/enrollments/${id}/`
    );

    return response.data;
};

export const continueLearning = async () => {

    const response = await axiosInstance.get(
        "/v2/enrollments/continue-learning/"
    );

    return response.data;
};

export const updateEnrollment = async (
    id: number,
    data: Partial<Enrollment>
) => {

    const response = await axiosInstance.patch<Enrollment>(
        `/v2/enrollments/${id}/`,
        data,
    );

    return response.data;
};

export const deleteEnrollment = async (
    id: number
) => {

    await axiosInstance.delete(
        `/v2/enrollments/${id}/`
    );
};

export const getCompletedCourses = async () => {

    const response = await axiosInstance.get<Enrollment[]>(
        "/v2/enrollments/",
        {
            params: {
                status: "completed",
            },
        }
    );

    return response.data;
};

export const getActiveCourses = async () => {

    const response = await axiosInstance.get<Enrollment[]>(
        "/v2/enrollments/",
        {
            params: {
                status: "active",
            },
        }
    );

    return response.data;
};

export const checkEnrollment = async (
    courseId: number
) => {

    const response = await axiosInstance.get<Enrollment[]>(
        "/v2/enrollments/",
        {
            params: {
                course: courseId,
            },
        }
    );

    return response.data.length > 0
        ? response.data[0]
        : null;
};

export const updateCourseProgress = async (
    id: number,
    progress: number
) => {

    const response = await axiosInstance.patch<Enrollment>(
        `/v2/enrollments/${id}/`,
        {
            progress_percentage: progress,
        }
    );

    return response.data;
};

// ======================================================
// QUIZ
// ======================================================

export interface Quiz {

    id: number;

    course: number;
    course_title: string;

    section: number | null;
    section_title: string | null;

    title: string;

    description: string;

    instructions: string;

    passing_percentage: number;

    duration_minutes: number;

    max_attempts: number;

    total_marks: number;

    total_questions: number;

    shuffle_questions: boolean;

    shuffle_options: boolean;

    show_result_immediately: boolean;

    show_correct_answers: boolean;

    is_required: boolean;

    is_active: boolean;

    status:
        | "draft"
        | "published"
        | "archived";

    available_from: string | null;

    available_until: string | null;

    created_at: string;

    updated_at: string;
}

export const getQuizzes = async (
    params?: {
        course?: number;
        section?: number;
        status?: string;
        is_required?: boolean;
        search?: string;
        ordering?: string;
    }
): Promise<Quiz[]> => {

    const response = await axiosInstance.get(
        "/v2/quizzes/",
        {
            params,
        }
    );

    return response.data;
};

export const getQuiz = async (
    id: number
): Promise<Quiz> => {

    const response = await axiosInstance.get(
        `/v2/quizzes/${id}/`
    );

    return response.data;
};

export const createQuiz = async (
    data: Partial<Quiz>
): Promise<Quiz> => {

    const response = await axiosInstance.post(
        "/v2/quizzes/",
        data
    );

    return response.data;
};

export const updateQuiz = async (
    id: number,
    data: Partial<Quiz>
): Promise<Quiz> => {

    const response = await axiosInstance.patch(
        `/v2/quizzes/${id}/`,
        data
    );

    return response.data;
};

export const deleteQuiz = async (
    id: number
): Promise<void> => {

    await axiosInstance.delete(
        `/v2/quizzes/${id}/`
    );
};

export const getCourseQuizzes = async (
    courseId: number
): Promise<Quiz[]> => {

    const response = await axiosInstance.get(
        "/v2/quizzes/",
        {
            params: {
                course: courseId,
            },
        }
    );

    return response.data;
};

export const getSectionQuizzes = async (
    sectionId: number
): Promise<Quiz[]> => {

    const response = await axiosInstance.get(
        "/v2/quizzes/",
        {
            params: {
                section: sectionId,
            },
        }
    );

    return response.data;
};

export const getRequiredQuizzes = async (): Promise<Quiz[]> => {

    const response = await axiosInstance.get(
        "/v2/quizzes/",
        {
            params: {
                is_required: true,
            },
        }
    );

    return response.data;
};

export const searchQuizzes = async (
    search: string
): Promise<Quiz[]> => {

    const response = await axiosInstance.get(
        "/v2/quizzes/",
        {
            params: {
                search,
            },
        }
    );

    return response.data;
};

export const getPublishedQuizzes = async (): Promise<Quiz[]> => {

    const response = await axiosInstance.get(
        "/v2/quizzes/",
        {
            params: {
                status: "published",
            },
        }
    );

    return response.data;
};

export const getDraftQuizzes = async (): Promise<Quiz[]> => {

    const response = await axiosInstance.get(
        "/v2/quizzes/",
        {
            params: {
                status: "draft",
            },
        }
    );

    return response.data;
};

export const getArchivedQuizzes = async (): Promise<Quiz[]> => {

    const response = await axiosInstance.get(
        "/v2/quizzes/",
        {
            params: {
                status: "archived",
            },
        }
    );

    return response.data;
};

// ======================================================
// QUESTION
// ======================================================

export interface Question {

    id: number;

    quiz: number;

    quiz_title: string;

    question: string;

    question_type:
        | "mcq"
        | "true_false"
        | "short_answer"
        | "essay";

    explanation: string;

    marks: number;

    negative_marks: number;

    order: number;

    is_required: boolean;

    is_active: boolean;

    total_options: number;

    created_at: string;

    updated_at: string;
}

export const getQuestions = async (
    params?: {
        quiz?: number;
        question_type?: string;
        is_required?: boolean;
        search?: string;
        ordering?: string;
    }
): Promise<Question[]> => {

    const response = await axiosInstance.get(
        "/v2/questions/",
        {
            params,
        }
    );

    return response.data;
};

export const getQuestion = async (
    id: number
): Promise<Question> => {

    const response = await axiosInstance.get(
        `/v2/questions/${id}/`
    );

    return response.data;
};

export const createQuestion = async (
    data: Partial<Question>
): Promise<Question> => {

    const response = await axiosInstance.post(
        "/v2/questions/",
        data,
    );

    return response.data;
};

export const updateQuestion = async (
    id: number,
    data: Partial<Question>
): Promise<Question> => {

    const response = await axiosInstance.patch(
        `/v2/questions/${id}/`,
        data,
    );

    return response.data;
};

export const deleteQuestion = async (
    id: number
): Promise<void> => {

    await axiosInstance.delete(
        `/v2/questions/${id}/`
    );
};

export const getQuizQuestions = async (
    quizId: number
): Promise<Question[]> => {

    const response = await axiosInstance.get(
        "/v2/questions/",
        {
            params: {
                quiz: quizId,
            },
        }
    );

    return response.data;
};

export const getMCQQuestions = async (
    quizId?: number
): Promise<Question[]> => {

    const response = await axiosInstance.get(
        "/v2/questions/",
        {
            params: {
                quiz: quizId,
                question_type: "mcq",
            },
        }
    );

    return response.data;
};

export const getTrueFalseQuestions = async (
    quizId?: number
): Promise<Question[]> => {

    const response = await axiosInstance.get(
        "/v2/questions/",
        {
            params: {
                quiz: quizId,
                question_type: "true_false",
            },
        }
    );

    return response.data;
};

export const getEssayQuestions = async (
    quizId?: number
): Promise<Question[]> => {

    const response = await axiosInstance.get(
        "/v2/questions/",
        {
            params: {
                quiz: quizId,
                question_type: "essay",
            },
        }
    );

    return response.data;
};

export const getShortAnswerQuestions = async (
    quizId?: number
): Promise<Question[]> => {

    const response = await axiosInstance.get(
        "/v2/questions/",
        {
            params: {
                quiz: quizId,
                question_type: "short_answer",
            },
        }
    );

    return response.data;
};

export const searchQuestions = async (
    search: string
): Promise<Question[]> => {

    const response = await axiosInstance.get(
        "/v2/questions/",
        {
            params: {
                search,
            },
        }
    );

    return response.data;
};

export const reorderQuestions = async (
    id: number,
    order: number
): Promise<Question> => {

    const response = await axiosInstance.patch(
        `/v2/questions/${id}/`,
        {
            order,
        },
    );

    return response.data;
};

// ======================================================
// QUESTION OPTIONS
// ======================================================

export interface QuestionOption {

    id: number;

    question: number;

    question_text?: string;

    option_text: string;

    is_correct: boolean;

    explanation: string;

    order: number;

    is_active: boolean;

    created_at: string;

    updated_at: string;
}

export const getQuestionOptions = async (
    params?: {
        question?: number;
        search?: string;
        ordering?: string;
    }
): Promise<QuestionOption[]> => {

    const response = await axiosInstance.get(
        "/v2/question-options/",
        {
            params,
        }
    );

    return response.data;
};

export const getOptionsByQuestion = async (
    questionId: number
): Promise<QuestionOption[]> => {

    const response = await axiosInstance.get(
        "/v2/question-options/",
        {
            params: {
                question: questionId,
            },
        }
    );

    return response.data;
};

export const getQuestionOption = async (
    id: number
): Promise<QuestionOption> => {

    const response = await axiosInstance.get(
        `/v2/question-options/${id}/`
    );

    return response.data;
};

export const createQuestionOption = async (
    data: Partial<QuestionOption>
): Promise<QuestionOption> => {

    const response = await axiosInstance.post(
        "/v2/question-options/",
        data,
    );

    return response.data;
};

export const updateQuestionOption = async (
    id: number,
    data: Partial<QuestionOption>
): Promise<QuestionOption> => {

    const response = await axiosInstance.patch(
        `/v2/question-options/${id}/`,
        data,
    );

    return response.data;
};

export const deleteQuestionOption = async (
    id: number
): Promise<void> => {

    await axiosInstance.delete(
        `/v2/question-options/${id}/`
    );
};

export const searchQuestionOptions = async (
    search: string
): Promise<QuestionOption[]> => {

    const response = await axiosInstance.get(
        "/v2/question-options/",
        {
            params: {
                search,
            },
        }
    );

    return response.data;
};

export const reorderQuestionOption = async (
    id: number,
    order: number
): Promise<QuestionOption> => {

    const response = await axiosInstance.patch(
        `/v2/question-options/${id}/`,
        {
            order,
        },
    );

    return response.data;
};

export const setCorrectOption = async (
    id: number
): Promise<QuestionOption> => {

    const response = await axiosInstance.patch(
        `/v2/question-options/${id}/`,
        {
            is_correct: true,
        },
    );

    return response.data;
};

export const disableQuestionOption = async (
    id: number
): Promise<QuestionOption> => {

    const response = await axiosInstance.patch(
        `/v2/question-options/${id}/`,
        {
            is_active: false,
        },
    );

    return response.data;
};

// ======================================================
// QUIZ ATTEMPTS
// ======================================================

export interface QuizAttempt {
    id: number;
    quiz: number;
    attempt_number: number;
    status: "in_progress" | "submitted" | "expired" | "cancelled";
    score: number;
    total_marks: number;
    percentage: number;
    is_passed: boolean;
    started_at: string;
    submitted_at?: string;
    time_taken_seconds: number;
}

export interface QuizQuestionOption {
    id: number;
    option_text: string;
    order: number;
}

export interface QuizQuestion {
    id: number;
    question: string;
    question_type: "mcq" | "true_false" | "short_answer" | "essay";
    marks: number;
    negative_marks: number;
    order: number;
    is_required: boolean;
    options: QuizQuestionOption[];
}

export interface StartQuizResponse {
    success: boolean;
    message: string;
    attempt_id: number;
    quiz: {
        id: number;
        title: string;
        description: string;
        instructions: string;
        duration_minutes: number;
        passing_percentage: number;
        total_marks: number;
        max_attempts: number;
        show_result_immediately: boolean;
        show_correct_answers: boolean;
        questions: QuizQuestion[];
    };
}

export interface SubmitQuizAnswer {
    question_id: number;
    selected_option_id?: number;
    text_answer?: string;
}

export interface SubmitQuizResponse {
    success: boolean;
    message: string;
    attempt_id: number;
    score: number;
    total_marks: number;
    percentage: number;
    passed: boolean;
}

export const startQuiz = async (
    quizId: number
): Promise<StartQuizResponse> => {

    const response = await axiosInstance.post(
        "/v2/quiz-attempts/start/",
        {
            quiz_id: quizId,
        }
    );

    return response.data;
};

export const submitQuiz = async (
    attemptId: number,
    timeTakenSeconds: number,
    answers: SubmitQuizAnswer[],
): Promise<SubmitQuizResponse> => {

    const response = await axiosInstance.post(
        "/v2/quiz-attempts/submit/",
        {
            attempt_id: attemptId,
            time_taken_seconds: timeTakenSeconds,
            answers,
        }
    );

    return response.data;
};

export const getMyQuizAttempts = async (): Promise<QuizAttempt[]> => {

    const response = await axiosInstance.get(
        "/v2/quiz-attempts/my-attempts/"
    );

    return response.data;
};

export const getLatestQuizAttempt = async (
    quizId: number,
): Promise<QuizAttempt> => {

    const response = await axiosInstance.get(
        "/v2/quiz-attempts/latest/",
        {
            params: {
                quiz: quizId,
            },
        }
    );

    return response.data;
};

export const getQuizAttempt = async (
    attemptId: number,
): Promise<QuizAttempt> => {

    const response = await axiosInstance.get(
        `/v2/quiz-attempts/${attemptId}/`
    );

    return response.data;
};

export const getQuizAttempts = async (
    params?: {
        quiz?: number;
        status?: string;
        is_passed?: boolean;
        ordering?: string;
    },
): Promise<QuizAttempt[]> => {

    const response = await axiosInstance.get(
        "/v2/quiz-attempts/",
        {
            params,
        }
    );

    return response.data;
};

// ======================================================
// JOBS
// ======================================================

export interface Job {
    id: number;
    company: number;
    company_name?: string;

    title: string;
    description: string;

    responsibilities: string;
    requirements: string;
    skills: string[];

    location: string;

    job_type:
        | "full_time"
        | "part_time"
        | "contract"
        | "remote";

    experience_level:
        | "fresher"
        | "0_1"
        | "1_3"
        | "3_plus";

    salary_min: number;
    salary_max: number;

    vacancies: number;

    application_deadline?: string;

    status:
        | "draft"
        | "published"
        | "closed";

    is_active: boolean;

    created_at: string;
    updated_at: string;
}

export interface JobApplication {

    id: number;

    job: number;

    job_title?: string;

    company_name?: string;

    student: number;

    student_name?: string;

    cover_letter: string;

    resume_url: string;

    status:
        | "applied"
        | "shortlisted"
        | "interview"
        | "offered"
        | "rejected"
        | "withdrawn";

    company_notes: string;

    applied_at: string;

    updated_at: string;
}

export const getJobs = async (
    params?: {
        company?: number;
        location?: string;
        job_type?: string;
        ordering?: string;
    },
): Promise<Job[]> => {

    const response = await axiosInstance.get(
        "/v2/jobs/",
        {
            params,
        },
    );

    return response.data;
};

export const getJob = async (
    id: number,
): Promise<Job> => {

    const response = await axiosInstance.get(
        `/v2/jobs/${id}/`,
    );

    return response.data;
};

export const createJob = async (
    data: Partial<Job>,
): Promise<Job> => {

    const response = await axiosInstance.post(
        "/v2/jobs/",
        data,
    );

    return response.data;
};

export const updateJob = async (
    id: number,
    data: Partial<Job>,
): Promise<Job> => {

    const response = await axiosInstance.patch(
        `/v2/jobs/${id}/`,
        data,
    );

    return response.data;
};

export const deleteJob = async (
    id: number,
): Promise<void> => {

    await axiosInstance.delete(
        `/v2/jobs/${id}/`,
    );
};

export interface ApplyJobRequest {

    job: number;

    cover_letter?: string;

    resume_url?: string;
}

export const applyForJob = async (
    data: ApplyJobRequest,
): Promise<any> => {

    const response = await axiosInstance.post(
        "/v2/job-applications/apply/",
        data,
    );

    return response.data;
};

export const getMyJobApplications = async (): Promise<JobApplication[]> => {

    const response = await axiosInstance.get(
        "/v2/job-applications/my-applications/",
    );

    return response.data;
};

export const getJobApplications = async (
    params?: {
        job?: number;
        status?: string;
    },
): Promise<JobApplication[]> => {

    const response = await axiosInstance.get(
        "/v2/job-applications/",
        {
            params,
        },
    );

    return response.data;
};

export const withdrawJobApplication = async (
    id: number,
): Promise<any> => {

    const response = await axiosInstance.post(
        `/v2/job-applications/${id}/withdraw/`,
    );

    return response.data;
};

export const updateJobApplicationStatus = async (
    id: number,
    status: string,
    company_notes = "",
): Promise<any> => {

    const response = await axiosInstance.patch(
        `/v2/job-applications/${id}/update-status/`,
        {
            status,
            company_notes,
        },
    );

    return response.data;
};

export interface Internship {

    id: number;

    company: number;

    company_name?: string;

    title: string;

    description: string;

    responsibilities: string;

    requirements: string;

    skills: string[];

    location: string;

    internship_type:
        | "full_time"
        | "part_time"
        | "remote"
        | "hybrid";

    duration_months: number;

    stipend: number;

    vacancies: number;

    ppo_available: boolean;

    certificate_provided: boolean;

    application_deadline?: string;

    status:
        | "draft"
        | "published"
        | "closed";

    is_active: boolean;

    created_at: string;

    updated_at: string;
}

export interface InternshipApplication {

    id: number;

    internship: number;

    internship_title?: string;

    company_name?: string;

    student: number;

    student_name?: string;

    cover_letter: string;

    resume_url: string;

    status:
        | "applied"
        | "shortlisted"
        | "interview"
        | "selected"
        | "rejected"
        | "withdrawn";

    company_notes: string;

    applied_at: string;

    updated_at: string;
}

export const getInternships = async (
    params?: {
        company?: number;
        location?: string;
        internship_type?: string;
        ordering?: string;
    },
): Promise<Internship[]> => {

    const response = await axiosInstance.get(
        "/v2/internships/",
        {
            params,
        },
    );

    return response.data;
};

export const getInternship = async (
    id: number,
): Promise<Internship> => {

    const response = await axiosInstance.get(
        `/v2/internships/${id}/`,
    );

    return response.data;
};

export const createInternship = async (
    data: Partial<Internship>,
): Promise<Internship> => {

    const response = await axiosInstance.post(
        "/v2/internships/",
        data,
    );

    return response.data;
};

export const updateInternship = async (
    id: number,
    data: Partial<Internship>,
): Promise<Internship> => {

    const response = await axiosInstance.patch(
        `/v2/internships/${id}/`,
        data,
    );

    return response.data;
};

export const deleteInternship = async (
    id: number,
): Promise<void> => {

    await axiosInstance.delete(
        `/v2/internships/${id}/`,
    );
};

export interface ApplyInternshipRequest {

    internship: number;

    cover_letter?: string;

    resume_url?: string;
}

export const applyForInternship = async (
    data: ApplyInternshipRequest,
): Promise<any> => {

    const response = await axiosInstance.post(
        "/v2/internship-applications/apply/",
        data,
    );

    return response.data;
};

export const getMyInternshipApplications = async (): Promise<InternshipApplication[]> => {

    const response = await axiosInstance.get(
        "/v2/internship-applications/my-applications/",
    );

    return response.data;
};

export const getInternshipApplications = async (
    params?: {
        internship?: number;
        status?: string;
    },
): Promise<InternshipApplication[]> => {

    const response = await axiosInstance.get(
        "/v2/internship-applications/",
        {
            params,
        },
    );

    return response.data;
};

export const withdrawInternshipApplication = async (
    id: number,
): Promise<any> => {

    const response = await axiosInstance.post(
        `/v2/internship-applications/${id}/withdraw/`,
    );

    return response.data;
};

export const updateInternshipApplicationStatus = async (
    id: number,
    status: string,
    company_notes = "",
): Promise<any> => {

    const response = await axiosInstance.patch(
        `/v2/internship-applications/${id}/update-status/`,
        {
            status,
            company_notes,
        },
    );

    return response.data;
};

export interface CompanyUser {

    id: number;

    user: number;

    display_name?: string;

    email?: string;

    company: number;

    company_name?: string;

    designation: string;

    role:
        | "owner"
        | "admin"
        | "hr"
        | "recruiter";

    can_post_jobs: boolean;

    can_edit_jobs: boolean;

    can_delete_jobs: boolean;

    can_view_applications: boolean;

    can_update_application_status: boolean;

    is_primary: boolean;

    is_active: boolean;

    joined_at: string;
}

export const getCompanyUsers = async (): Promise<CompanyUser[]> => {

    const response = await axiosInstance.get(
        "/v2/company-users/"
    );

    return response.data;
};

export const getCompanyUser = async (
    id: number,
): Promise<CompanyUser> => {

    const response = await axiosInstance.get(
        `/v2/company-users/${id}/`
    );

    return response.data;
};

export const getMyCompanyProfile = async (): Promise<CompanyUser> => {

    const response = await axiosInstance.get(
        "/v2/company-users/my-profile/"
    );

    return response.data;
};

export const createCompanyUser = async (
    data: Partial<CompanyUser>,
): Promise<any> => {

    const response = await axiosInstance.post(
        "/v2/company-users/",
        data,
    );

    return response.data;
};

export const updateCompanyUser = async (
    id: number,
    data: Partial<CompanyUser>,
): Promise<any> => {

    const response = await axiosInstance.patch(
        `/v2/company-users/${id}/`,
        data,
    );

    return response.data;
};

export const deleteCompanyUser = async (
    id: number,
): Promise<void> => {

    await axiosInstance.delete(
        `/v2/company-users/${id}/`,
    );
};

// ======================================================
// COURSE CONTENT
// ======================================================

export interface CourseContentResponse {
    success: boolean;
    message: string;
    data: Course;
}

export const getCourseContent = async (
    courseId: number,
): Promise<CourseContentResponse> => {

    const response = await axiosInstance.get(
        `/v2/courses/${courseId}/content/`,
    );

    return response.data;
};

export interface CourseEnrollmentStatus {

    is_enrolled: boolean;

    status: string | null;

    progress_percentage: number;

    last_lecture?: {
        id: number;
        title: string;
    } | null;

    certificate_generated: boolean;

    expires_at: string | null;

    purchase_price: number;
}

export const getCourseEnrollmentStatus = async (
    courseId: number,
): Promise<CourseEnrollmentStatus> => {

    const response = await axiosInstance.get(
        `/v2/courses/${courseId}/enrollment-status/`,
    );

    return response.data.data;
};

// ======================================================
// JOB DETAILS
// ======================================================

export interface JobApplicationInfo {

    id: number;

    status:
        | "pending"
        | "under_review"
        | "shortlisted"
        | "rejected"
        | "selected";

    resume?: string;

    cover_letter?: string;

    expected_salary?: number;

    created_at: string;

    updated_at: string;
}

export interface JobCompany {

    id: number;

    company_name: string;

    logo: string;

    website: string;

    industry: string;

    headquarters: string;

    city: string;

    state: string;

    country: string;

    employee_count: number;

    is_verified: boolean;
}

export interface JobDetails {

    id: number;

    title: string;

    slug: string;

    company: JobCompany;

    description: string;

    job_type: string;

    work_mode: string;

    experience_level: string;

    vacancies: number;

    salary_min: number;

    salary_max: number;

    salary_currency: string;

    location: string;

    city: string;

    state: string;

    country: string;

    required_skills: string;

    skills: string[];

    education: string;

    application_deadline: string;

    joining_date: string;

    is_featured: boolean;

    views: number;

    status: string;

    created_at: string;

    updated_at: string;

    is_applied: boolean;

    can_apply: boolean;

    is_open: boolean;

    is_expired: boolean;

    application_status?: string;

    application?: JobApplicationInfo | null;
}

export interface JobDetailsResponse {

    success: boolean;

    message: string;

    data: JobDetails;
}

// ======================================================
// GET JOB DETAILS
// ======================================================

export const getJobDetails = async (
    jobId: number,
): Promise<JobDetailsResponse> => {

    const response = await axiosInstance.get(
        `/v2/jobs/${jobId}/details/`,
    );

    return response.data;
};

// ======================================================
// INTERNSHIP DETAILS
// ======================================================

export interface InternshipCompany {

    id: number;

    company_name: string;

    logo: string;

    website: string;

    industry: string;

    headquarters: string;

    city: string;

    state: string;

    country: string;

    employee_count: number;

    is_verified: boolean;
}

export interface InternshipApplication {

    id: number;

    resume?: string;

    created_at: string;

    updated_at: string;
}

export interface InternshipDetails {

    id: number;

    title: string;

    slug: string;

    company: InternshipCompany;

    description: string;

    internship_type: string;

    work_mode: string;

    duration: string;

    stipend: number;

    vacancies: number;

    location: string;

    city: string;

    state: string;

    country: string;

    required_skills: string;

    skills: string[];

    application_deadline: string;

    joining_date: string;

    is_featured: boolean;

    views: number;

    status: string;

    created_at: string;

    updated_at: string;

    is_applied: boolean;

    can_apply: boolean;

    is_open: boolean;

    is_expired: boolean;

    application_status?: string | null;

    application?: InternshipApplication | null;
}

export interface InternshipDetailsResponse {

    success: boolean;

    message: string;

    data: InternshipDetails;
}

// ======================================================
// GET INTERNSHIP DETAILS
// ======================================================

export const getInternshipDetails = async (
    internshipId: number,
): Promise<InternshipDetailsResponse> => {

    const response = await axiosInstance.get(
        `/v2/internships/${internshipId}/details/`,
    );

    return response.data;
};


// ----------------------------------------------------------
// COMPANY APPLICATION (Public)
// ----------------------------------------------------------

export interface CompanyApplication {
  id: number;
  company_name: string;
  industry: string | null;
  website: string | null;
  email: string;
  phone: string;
  hr_name: string | null;
  hr_email: string | null;
  hr_phone: string | null;
  address: string;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  company_description: string | null;
  logo: string | null;               // URL to uploaded logo
  registration_number: string | null;
  gst_number: string | null;
  pan_number: string | null;
  linkedin_url: string | null;
  employee_count: number | null;
  founded_year: number | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  approved_at: string | null;
  reviewed_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface ApplyCompanyResponse {
  success: boolean;
  message: string;
  data: CompanyApplication;
}

export interface CompanyApplicationDetailResponse {
  success: boolean;
  data: CompanyApplication;
}

/**
 * Submit a new company application (public).
 * The request includes a logo image, so use FormData.
 */
export const applyForCompany = async (
  formData: FormData
): Promise<ApplyCompanyResponse> => {
  const response = await axiosInstance.post<ApplyCompanyResponse>(
    '/accounts/company/apply/',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

/**
 * Get a company application by its ID (public).
 */
export const getCompanyApplication = async (
  applicationId: number
): Promise<CompanyApplicationDetailResponse> => {
  const response = await axiosInstance.get<CompanyApplicationDetailResponse>(
    `/accounts/company/apply/${applicationId}/`
  );
  return response.data;
};

// ----------------------------------------------------------
// ADMIN – COMPANY APPLICATIONS
// ----------------------------------------------------------

export interface AdminCompanyApplication extends CompanyApplication {
  reviewed_by_name: string | null;   // added by serializer
}

export interface AdminCompanyApplicationsListResponse {
  success: boolean;
  count: number;
  results: AdminCompanyApplication[];
}

export interface AdminCompanyApplicationDetailResponse {
  success: boolean;
  data: AdminCompanyApplication;
}

export interface ApproveCompanyResponse {
  success: boolean;
  message: string;
  user_id: number;
  company_id: number;
  temporary_password: string;
}

export interface RejectCompanyResponse {
  success: boolean;
  message: string;
}

/**
 * List all company applications (admin only).
 * Optional status filter: ?status=pending
 */
export const getAdminCompanyApplications = async (
  status?: 'pending' | 'approved' | 'rejected'
): Promise<AdminCompanyApplicationsListResponse> => {
  const params = status ? { status } : {};
  const response = await axiosInstance.get<AdminCompanyApplicationsListResponse>(
    '/accounts/admin/company-applications/',
    { params }
  );
  return response.data;
};

/**
 * Get a single application detail (admin only).
 */
export const getAdminCompanyApplication = async (
  applicationId: number
): Promise<AdminCompanyApplicationDetailResponse> => {
  const response = await axiosInstance.get<AdminCompanyApplicationDetailResponse>(
    `/accounts/admin/company-applications/${applicationId}/`
  );
  return response.data;
};

/**
 * Approve a pending application (admin only).
 */
export const approveCompanyApplication = async (
  applicationId: number
): Promise<ApproveCompanyResponse> => {
  const response = await axiosInstance.post<ApproveCompanyResponse>(
    `/accounts/admin/company-applications/${applicationId}/approve/`
  );
  return response.data;
};

/**
 * Reject a pending application with a reason (admin only).
 */
export const rejectCompanyApplication = async (
  applicationId: number,
  rejectionReason: string
): Promise<RejectCompanyResponse> => {
  const response = await axiosInstance.post<RejectCompanyResponse>(
    `/accounts/admin/company-applications/${applicationId}/reject/`,
    { rejection_reason: rejectionReason }
  );
  return response.data;
};

// ----------------------------------------------------------
// COMPANY PROFILE (Authenticated company user)
// ----------------------------------------------------------

export interface CompanyProfile {
  id: number;
  company_name: string;
  company_code: string;       // read-only
  logo: string | null;
  banner: string;
  description: string;
  website: string;
  email: string;
  phone: string;
  industry: string;
  founded_year: number | null;
  employee_count: number;
  headquarters: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  linkedin_url: string;
  twitter_url: string;
  facebook_url: string;
  instagram_url: string;
  registration_number: string;
  gst_number: string;
  pan_number: string;
  status: 'pending' | 'approved' | 'rejected' | 'blocked';
  is_verified: boolean;
  is_active: boolean;
}

export interface CompanyProfileResponse {
  success: boolean;
  data: CompanyProfile;
}

export interface CompanyProfileUpdateResponse {
  success: boolean;
  message: string;
  data: CompanyProfile;
}

/**
 * Get the authenticated company user's own profile.
 */
export const getCompanyProfile = async (): Promise<CompanyProfileResponse> => {
  const response = await axiosInstance.get<CompanyProfileResponse>(
    '/accounts/company/profile/'
  );
  return response.data;
};

/**
 * Update the authenticated company user's profile (partial update).
 */
export const updateCompanyProfile = async (
  data: Partial<CompanyProfile>
): Promise<CompanyProfileUpdateResponse> => {
  const response = await axiosInstance.put<CompanyProfileUpdateResponse>(
    '/accounts/company/profile/',
    data
  );
  return response.data;
};



export interface ActivePlanCategory {
  category: string;
  remaining_credits: string;
  total_credits: string;
}

export interface ActivePlan {
  id: number;
  plan_name: string;
  purchase_amount: string;
  purchased_at: string;
  expires_at: string;
  remaining_days: number;
  status: "active" | "completed" | "expired";
  total_credits: string;
  remaining_credits: string;
}

export interface ActivePlansResponse {
  success: boolean;
  status: number;
  message: string;
  data: ActivePlan[];
}
/**
 * Get all active credit plans
 */
export const getMyActivePlans =
  async (): Promise<ActivePlansResponse> => {
    const response = await axiosInstance.get(
      "/credits/my-active-plans/"
    );

    return response.data;
  };

export interface PurchaseHistory {
  id: number;
  plan_name: string;
  purchase_amount: string;
  purchased_at: string;
  expires_at: string;
  remaining_days: number;
  status: "active" | "completed" | "expired";
  remaining_credits: string;
}

export interface PurchaseHistoryResponse {
  success: boolean;
  status: number;
  message: string;
  data: PurchaseHistory[];
}

export const getPurchaseHistory =
  async (): Promise<PurchaseHistoryResponse> => {
    const response = await axiosInstance.get(
      "/credits/purchase-history/"
    );

    return response.data;
  };

export const mobilePaymentLogin = async (
    token: string
) => {
    return axiosInstance.post(
        "/credits/mobile-payment-login/",
        {
            token,
        }
    );
};

// ======================================================
// KNOWMATO+ DASHBOARD
// ======================================================

export interface DashboardUserInfo {
  id: number;
  username: string;
  email: string;
  display_name: string;
  avatar: string;
}

export interface DashboardStats {
  enrolled_courses: number;
  active_enrollments: number;
  completed_enrollments: number;
  wishlist_count: number;
  quiz_attempts: number;
  quiz_passed: number;
  avg_quiz_percentage: number;
  certificates_count: number;
  job_applications_total: number;
  job_shortlisted: number;
  internship_applications_total: number;
  internship_shortlisted: number;
}

export interface DashboardEnrollment {
  enrollment_id: number;
  course_id: number;
  course_title: string;
  course_slug: string;
  thumbnail: string;
  status: "active" | "completed" | "cancelled" | "expired";
  progress_percentage: number;
  last_lecture: string | null;
  last_accessed_at: string | null;
  enrolled_at: string;
  expires_at: string | null;
  certificate_available: boolean;
  category: string | null;
}

export interface DashboardQuizAttempt {
  quiz_title: string;
  course_title: string;
  attempt_number: number;
  score: number;
  total_marks: number;
  percentage: number;
  is_passed: boolean;
  submitted_at: string | null;
}

export interface DashboardJobSummary {
  total: number;
  shortlisted: number;
  interview: number;
  offered: number;
  rejected: number;
}

export interface DashboardInternshipSummary {
  total: number;
  shortlisted: number;
  interview: number;
  selected: number;
  rejected: number;
}

export interface DashboardAnnouncement {
  id: number;
  course_title: string;
  title: string;
  message: string;
  created_at: string;
}

export interface DashboardRecommendedCourse {
  id: number;
  title: string;
  slug: string;
  thumbnail: string;
  instructor: string;
  category: string | null;
  rating: number;
  students: number;
  price: number;
  discounted_price: number | null;
  course_type: "free" | "paid" | "premium";
}

export interface DashboardData {
  user: DashboardUserInfo;
  stats: DashboardStats;
  enrollments: DashboardEnrollment[];
  recent_quiz_attempts: DashboardQuizAttempt[];
  job_application_summary: DashboardJobSummary;
  internship_application_summary: DashboardInternshipSummary;
  recent_announcements: DashboardAnnouncement[];
  recommended_courses: DashboardRecommendedCourse[];
}

export interface DashboardResponse {
  success: boolean;
  status: number;
  message: string;
  data: DashboardData;
}

/**
 * Fetch full KnowMato+ student dashboard data.
 */
export const getKnowMatoPlusDashboard = async (): Promise<DashboardResponse> => {
  const response = await axiosInstance.get<DashboardResponse>(
    "/v2/knowmato_plus/"   // adjust to your actual endpoint
  );

  return response.data;
};

// ----------------------------------------------------------
// CODE SNIPPETS (Save / Load)
// ----------------------------------------------------------

export interface CodeSnippet {
  id: number;
  title: string;
  description: string;
  language: string;
  source_code: string;
  created_at: string;
  updated_at: string;
}

export interface CodeSnippetPayload {
  title: string;
  description?: string;
  language: string;
  source_code: string;
}

/**
 * Get all saved snippets of the current user.
 */
export const getCodeSnippets = async (): Promise<CodeSnippet[]> => {
  const response = await axiosInstance.get('/v2/snippets/');
  return response.data;           // ApiResponse with data as CodeSnippet[]
};

/**
 * Get a single snippet by ID.
 */
export const getCodeSnippetById = async (id: number): Promise<CodeSnippet> => {
  const response = await axiosInstance.get(`/v2/snippets/${id}/`);
  return response.data;
};

/**
 * Create a new snippet.
 */
export const createCodeSnippet = async (
  payload: CodeSnippetPayload
): Promise<CodeSnippet> => {
  const response = await axiosInstance.post('/v2/snippets/', payload);
  return response.data;
};

/**
 * Update an existing snippet (partial update).
 */
export const updateCodeSnippet = async (
  id: number,
  payload: Partial<CodeSnippetPayload>
): Promise<CodeSnippet> => {
  const response = await axiosInstance.patch(`/v2/snippets/${id}/`, payload);
  return response.data;
};

/**
 * Delete a snippet.
 */
export const deleteCodeSnippet = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/v2/snippets/${id}/`);
};

export interface CreditBalance {
  balance: number;
}

export const getMyCreditBalances = async (): Promise<{
  success: boolean;
  status: number;
  message: string;
  data: CreditBalance;
}> => {
    const response = await axiosInstance.get('/credits/my-balances/');
    return response.data;
};