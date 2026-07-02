// services/v1Service.ts

import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from './apiService';

const apiGetWithParams = async <T = any>(
  url: string,
  params?: Record<string, any>
) => {
  if (!params || Object.keys(params).length === 0) {
    return await apiGet(url);
  }

  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    queryParams.append(key, String(value));
  });

  const queryString = queryParams.toString();
  if (!queryString) {
    return await apiGet(url);
  }

  const separator = url.includes('?') ? '&' : '?';
  return await apiGet(`${url}${separator}${queryString}`);
};

// ================== STUDENT ==================

// 📊 Dashboard
export const getStudentDashboard = async () => {
  return await apiGet('/v1/student/dashboard/');
};

export const getAdminDashboard = async () => {
  return await apiGet('/v1/admin/dashboard/');
};

export const getTutorDashboard = async () => {
  return await apiGet('/v1/tutor/dashboard/');
};

export interface availableTutor {
  id: number;
  name: string;
  is_online: boolean;
  is_verified: boolean;
  average_rating: number;
  total_reviews: number;
  is_top_tutor: boolean;
  skills: string;
}

export const getAvailableTutors = async () => {
  return await apiGet('/accounts/tutors/available');
}

export interface StudentSession {
  session_id: number;
  doubt: string;
  tutor: string;
  status: 'active' | 'completed' | 'cancelled' | 'scheduled';
  session_type: 'chat' | 'live_video';
  scheduled_at: string;

  // 🔥 NEW
  is_reviewed: boolean;
  rating?: number;
  feedback?: string;
}

// 📜 Doubt History
export const getMyDoubts = async (
  params: {
    status?: string;
    category?: string;
    mode?: string;
    search?: string;
    from_date?: string;
    to_date?: string;
    page?: number;
  }
) => {

  const query =
    new URLSearchParams();

  query.append(
    "page",
    String(params?.page || 1)
  );

  if (params?.search) {
    query.append(
      "search",
      params.search
    );
  }

  if (params?.status) {
    query.append(
      "status",
      params.status
    );
  }

  if (params?.category) {
    query.append(
      "category",
      params.category
    );
  }

  if (params?.mode) {
    query.append(
      "mode",
      params.mode
    );
  }

  return await apiGet(
    `/v1/student/doubts/?${query.toString()}`
  );
};

export const getDoubtDetails = async (doubtId: number) => {
  return await apiGet(`/v1/student/doubts/${doubtId}/`);
};

// 🔍 Session Detail
export const getSessionDetail = async (sessionId: number) => {
  const res = await apiGet(`/v1/session/${sessionId}/`);
  return res;
};

// ✍️ Submit Review
export const submitReview = async (data: {
  session_id: number;
  rating: number;
  feedback?: string;
}) => {
  return await apiPost('/v1/submit-review/', data);
};

// ================== DOUBT ==================

// 💰 Current Price
export const getCurrentPrice = async () => {
  return await apiGet('/v1/current-price/');
};

// ❓ Post Doubt
export const postDoubt = async (data: any) => {
  return await apiPost('/v1/post-doubt/', data);
};

// 💳 Payment Success
export const paymentSuccess = async (data: {
  doubt_id: number;
}) => {
  return await apiPost('/v1/payment-success/', data);
};

// ================== SESSION ==================

// ▶️ Start Session
export const startSession = async (sessionId: number) => {
  return await apiPost('/v1/start-session/', {
    session_id: sessionId,
  });
};

// ⏹ End Session
export const endSession = async (sessionId: number) => {
  return await apiPost('/v1/end-session/', {
    session_id: sessionId,
  });
};

// ⏱ Remaining Time
export const getSessionTime = async (sessionId: number) => {
  return await apiGet(`/v1/session-time/${sessionId}/`);
};

// ➕ Extend Session
export const extendSession = async (sessionId: number) => {
  return await apiPost('/v1/extend-session/', {
    session_id: sessionId,
  });
};

// ================== DIRECT REQUEST ==================

export const handleDirectRequest = async (data: {
  request_id: number;
  action: 'accept' | 'reject';
}) => {
  return await apiPost('/v1/handle-direct-request/', data);
};

export const toggleOnline = async (isOnline: boolean = true) => {
  return await apiPost('/v1/toggle-online/', {
    is_online: isOnline,
  });
};

// ✅ Heartbeat
export const sendHeartbeat = async () => {
  return await apiPost('/v1/heartbeat/', {});
};


export const getTutorRequests = async () => {
  return await apiGet('/v1/tutor/requests/');
};

export const getTutorPoolDoubts = async () => {
  return await apiGet('/v1/tutor/pool-doubts/');
};

export const AcceptPoolDoubt = async (data: {
  doubt_id: number;
}) => {
  return await apiPost('/v1/accept-doubt/', data);
};

export const getAdminDoubts = async (params: {
  status?: string;
  mode?: string;
  type?: string;
  category?: string;
  search?: string;
  page?: number;
}) => {
  return await apiGetWithParams('/v1/admin/doubts/', params);
};

export const getAdminDoubtDetails = async (doubtId: number) => {
  return await apiGet(`/v1/admin/doubts/${doubtId}/`);
};

export const getAdminSessions = async (params: {
  status?: string;
  session_type?: string;
  category?: string;
  search?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
}) => {
  return await apiGetWithParams('/v1/admin/sessions/', params);
};

/**
 * Get pricing slots (admin)
 */
export const getPricingSlots = async (params?: {
  date?: string;
  from_date?: string;
  to_date?: string;
  start_time?: string;
  page?: number;
}) => {
  return await apiGetWithParams('/v1/admin/pricing/', params);
};

export const createPricingSlot = async (data: {
  date: string;
  start_time: string;
  end_time: string;
  price: number;
}) => {
  return await apiPost('/v1/admin/pricing/create/', data);
};

export const updatePricingSlot = async (
  slotId: number,
  data: {
    date?: string;
    start_time?: string;
    end_time?: string;
    price?: number;
  }
) => {
  return await apiPut(`/v1/pricing-slots/${slotId}/`, data);
};

export const deletePricingSlot = async (slotId: number) => {
  return await apiDelete(`/v1/pricing-slots/${slotId}/`);
};

export const getStudentSessions = async (): Promise<StudentSession[]> => {
  const res = await apiGet('/v1/student/sessions/');
  return res.data; // assuming your backend returns { data: [...] }
};


// ================== Wallet Services ==================
// ================== Wallet Services ==================

// ======================================================
// 💰 MY WALLET
// ======================================================

export interface WalletEarnings {

  total_earnings: number;

  paid_earnings: number;

  pending_earnings: number;

  sessions_count: number;

}

export interface WalletDetails {

  real_balance: number;

  bonus_balance: number;

  total_balance: number;

  earnings: WalletEarnings | null;

}

export interface WalletResponse {

  message: string;

  data: WalletDetails;

}

// ============================================
// My Wallet
// ============================================

export const getMyWallet =
  async () => {

    return await apiGet(
      "/wallet/my"
    );

};
// ---------- Razorpay ----------
export interface CreateOrderRequest {
  amount: number; // in rupees (will be converted to paise on backend)
}

// ---------- Cashfree ----------

export interface CreateCashfreeOrderRequest {
  amount: number;
}

export interface CreateCashfreeOrderResponse {
  success: boolean;

  payment_session_id: string;

  order_id: string;

  amount: number;
}

export const createCashfreeOrder = async (
  data: CreateCashfreeOrderRequest
) => {

  return await apiPost(
    '/v1/wallet/',
    data
  );

};

export interface VerifyCashfreePaymentRequest {

  order_id: string;

  amount: number;

}

export interface VerifyCashfreePaymentResponse {

  message: string;

  real_balance: number;

  bonus_balance: number;

}

export const verifyCashfreePayment = async (
  data: VerifyCashfreePaymentRequest
) => {

  return await apiPost(
    '/v1/wallet/verify/',
    data
  );

};
// ---------- Wallet Transactions ----------
export interface Transaction {
  id: number;
  amount: number;        // total amount (real + bonus)
  real_amount: number;
  bonus_amount: number;
  type: 'credit' | 'debit';
  source: string;        // e.g., 'wallet_topup', 'session_payment', etc.
  session_id: number | null;
  doubt_id: number | null;
  description: string;
  date: string;          // YYYY-MM-DD
  time: string;          // HH:MM:SS
  created_at: string;    // ISO datetime
}

export interface WalletInfo {
  real_balance: number;
  bonus_balance: number;
  total_balance: number;
}

export interface TransactionListResponse {
  success: boolean;
  message: string;
  wallet: WalletInfo;
  transactions: Transaction[];
  count: number;
  next: string | null;
  previous: string | null;
}

export interface TransactionFilters {
  page?: number;
  page_size?: number;
  type?: "credit" | "debit";

  search?: string;
  start_date?: string;
  end_date?: string;
}

export const getTransactionHistory = async (filters?: TransactionFilters) => {
  return await apiGetWithParams('/v1/wallet/transactions/', filters);
};

// ---------- Wallet Offers (Admin) ----------
export interface WalletOffer {
  id: number;
  title: string;
  description?: string;
  min_amount: number;        // minimum top-up amount to qualify
  bonus_percentage: number;  // e.g., 10 for 10%
  max_bonus: number;         // maximum bonus amount
  is_active: boolean;
  start_date: string;        // ISO date
  end_date: string;          // ISO date
  created_at: string;
}

export interface CreateWalletOfferRequest {
  title: string;
  description?: string;
  min_amount: number;
  bonus_percentage: number;
  max_bonus: number;
  start_date: string;        // YYYY-MM-DD
  end_date: string;          // YYYY-MM-DD
}

export const createWalletOffer = async (data: CreateWalletOfferRequest) => {
  return await apiPost('/v1/wallet/offers/create/', data);
};

export const listWalletOffers = async () => {
  return await apiGet('/v1/wallet/offers/');
};

export const toggleWalletOffer = async (offerId: number) => {
  return await apiPost('/v1/wallet/offers/toggle/', { offer_id: offerId });
};

// ---------- Available Offers (Student) ----------
export interface AvailableOffer extends WalletOffer {
  // same fields as WalletOffer
}

export const getAvailableWalletOffers = async () => {
  return await apiGet('/v1/wallet/offers/available/');
};

export const getOnlineTutors =
  async () => {

    return await apiGet(
      "/accounts/online-tutors/"
    );

};

export interface MyTutorEarning {

  earning_id: number;

  session_id: number;

  amount: number;

  is_paid: boolean;

  created_at: string;

}

export interface MyTutorEarningsResponse {

  summary: {

    total_earnings: number;

    paid_earnings: number;

    pending_earnings: number;

    total_sessions: number;

  };

  data: MyTutorEarning[];

}

export const getMyTutorEarnings =
  async (): Promise<MyTutorEarningsResponse> => {

    return await apiGet(
      "/wallet/tutor/earnings/"
    );

};

// =====================================================
// 💰 ADMIN TUTOR EARNINGS
// =====================================================

export interface TutorEarning {
  earning_id: number;

  tutor: string;
  tutor_id: number;

  session_id: number;

  doubt_id: number | null;
  doubt_title: string | null;

  amount: number;

  is_paid: boolean;

  created_at: string;
}

export interface TutorEarningsResponse {
  total: number;
  data: TutorEarning[];
}

// 🔥 Get tutor earnings
export const getTutorEarnings = async (
  is_paid?: boolean
): Promise<TutorEarningsResponse> => {

  const params =
    is_paid !== undefined
      ? { is_paid }
      : undefined;

  return await apiGetWithParams(
    '/v1/admin/tutor/earnings/',
    params
  );

};

// ✅ Mark tutor earnings as paid
export const markTutorEarningsPaid = async (
  earningIds: number[]
) => {

  return await apiPost(
    '/v1/admin/pay/tutor/',
    {
      earning_ids: earningIds,
    }
  );

};

// ======================================================
// 👨‍💼 ADMIN USER MANAGEMENT
// ======================================================

export const getAdminUsers =
  async (role?: string) => {

    let endpoint =
      '/v1/admin/users/';

    if (role) {

      endpoint += `?role=${role}`;

    }

    return await apiGet(endpoint);

};

// ======================================================
// ⭐ TOGGLE TUTOR BADGES
// ======================================================

export const toggleTutorBadge =
  async (
    tutorId: number,
    action:
      | 'verify'
      | 'unverify'
      | 'top'
      | 'remove_top'
  ) => {

    return await apiPost(
      '/v1/admin/tutor/badge/',
      {
        tutor_id: tutorId,
        action,
      }
    );

};

// ======================================================
// 👨‍🏫 TUTOR PROFILE
// ======================================================

// ======================================================
// 👨‍🏫 TUTOR PROFILE
// ======================================================

export interface TutorProfile {

  id: number;

  // User Info
  display_name: string;
  email: string;
  role: string;

  // Existing
  bio: string;
  skills: string;
  experience: number;

  is_verified: boolean;

  average_rating: number;
  total_reviews: number;

  is_top_tutor: boolean;

  is_online: boolean;
  last_seen: string | null;

  // Contact Information
  phone_number: string;
  city_state: string;
  linkedin_profile: string;

  // Education
  highest_qualification: string;
  degree: string;
  college_name: string;
  year_of_completion: number | null;

  // Professional
  expertise_level: string;
  current_status: string;
  organization: string;
  professional_summary: string;

  // Multi Select
  mentor_subjects: string[];
  mentor_languages: string[];

  // Resume
  resume: string | null;

  // Application
  application_submitted: boolean;
  application_submitted_at: string | null;
}

// ======================================================
// 👨‍🏫 GET MY TUTOR PROFILE
// ======================================================

export const getTutorProfile =
  async (): Promise<{
    success: boolean;
    data: TutorProfile;
  }> => {

    return await apiGet(
      '/accounts/tutor/profile/'
    );

};

// ======================================================
// ✏️ UPDATE TUTOR PROFILE
// ======================================================

export interface UpdateTutorProfileRequest {

  bio?: string;

  skills?: string;

  experience?: number;

  phone_number?: string;

  city_state?: string;

  linkedin_profile?: string;

  highest_qualification?: string;

  degree?: string;

  college_name?: string;

  year_of_completion?: number;

  expertise_level?: string;

  current_status?: string;

  organization?: string;

  professional_summary?: string;

  mentor_subjects?: string[];

  mentor_languages?: string[];
}

// ======================================================
// ✏️ UPDATE PROFILE
// ======================================================

export const updateTutorProfile =
  async (
    data: FormData
  ) => {

    return await apiPut(
      '/accounts/tutor/profile/',
      data,
      {
        headers: {
          'Content-Type':
            'multipart/form-data',
        },
      }
    );

};
// ======================================================
// 👨‍💼 ADMIN - GET ALL TUTORS
// ======================================================

export interface AdminTutorProfile {

  id: number;

  display_name: string;

  email: string;

  role: string;

  bio: string;

  skills: string;

  experience: number;

  is_verified: boolean;

  average_rating: number;

  total_reviews: number;

  is_top_tutor: boolean;

  is_online: boolean;

  last_seen: string | null;
}

export const getAdminTutors =
  async (): Promise<AdminTutorProfile[]> => {

    return await apiGet(
      '/accounts/admin/tutors/'
    );

};

// ======================================================
// ✅ ADMIN VERIFY / TOP TUTOR
// ======================================================

export interface VerifyTutorRequest {

  is_verified?: boolean;

  is_top_tutor?: boolean;
}

export const verifyTutor =
  async (
    tutorId: number,
    data: VerifyTutorRequest
  ) => {

    return await apiPut(
      `/accounts/admin/tutors/${tutorId}/verify/`,
      data
    );

};

// ======================================================
// 📰 CURRENT AFFAIRS
// ======================================================

// ============================================
// TYPES
// ============================================

export interface CurrentAffair {

  id: number;

  title: string;

  description: string;

  category:
    | 'technology'
    | 'science'
    | 'business'
    | 'education'
    | 'ai'
    | 'programming'
    | 'general';

  image: string | null;

  image_url: string | null;

  is_published: boolean;

  created_at: string;
}

export interface CurrentAffairsResponse {

  message: string;

  data: CurrentAffair[];
}

// ============================================
// STUDENT
// GET CURRENT AFFAIRS
// ============================================

export const getCurrentAffairs =
  async (): Promise<CurrentAffairsResponse> => {

    return await apiGet(
      '/v1/current-affairs/'
    );

};

// ============================================
// ADMIN
// GET ALL CURRENT AFFAIRS
// ============================================

export const getAdminCurrentAffairs =
  async (): Promise<CurrentAffairsResponse> => {

    return await apiGet(
      '/v1/admin/current-affairs/'
    );

};

// ============================================
// ADMIN
// CREATE CURRENT AFFAIR
// ============================================

export interface CreateCurrentAffairPayload {

  title: string;

  description: string;

  category: string;

  is_published: boolean;

  image?: File | null;
}

export const createCurrentAffair =
  async (
    data: CreateCurrentAffairPayload
  ) => {

    const formData =
      new FormData();

    formData.append(
      'title',
      data.title
    );

    formData.append(
      'description',
      data.description
    );

    formData.append(
      'category',
      data.category
    );

    formData.append(
      'is_published',
      String(data.is_published)
    );

    // IMAGE

    if (data.image) {

      formData.append(
        'image',
        data.image
      );
    }

    return await apiPost(

      '/v1/admin/current-affairs/create/',

      formData,

      {
        headers: {
          'Content-Type':
            'multipart/form-data',
        },
      }
    );

};

// ============================================
// ADMIN
// UPDATE CURRENT AFFAIR
// ============================================

export interface UpdateCurrentAffairPayload {

  title?: string;

  description?: string;

  category?: string;

  is_published?: boolean;

  image?: File | null;
}

export const updateCurrentAffair =
  async (

    affairId: number,

    data: UpdateCurrentAffairPayload

  ) => {

    const formData =
      new FormData();

    // TITLE

    if (data.title !== undefined) {

      formData.append(
        'title',
        data.title
      );
    }

    // DESCRIPTION

    if (
      data.description !== undefined
    ) {

      formData.append(
        'description',
        data.description
      );
    }

    // CATEGORY

    if (
      data.category !== undefined
    ) {

      formData.append(
        'category',
        data.category
      );
    }

    // PUBLISH

    if (
      data.is_published !== undefined
    ) {

      formData.append(

        'is_published',

        String(
          data.is_published
        )
      );
    }

    // IMAGE

    if (data.image) {

      formData.append(
        'image',
        data.image
      );
    }

    return await apiPut(

      `/v1/admin/current-affairs/${affairId}/`,

      formData,

      {
        headers: {
          'Content-Type':
            'multipart/form-data',
        },
      }
    );

};

// ============================================
// ADMIN
// DELETE CURRENT AFFAIR
// ============================================

export const deleteCurrentAffair =
  async (
    affairId: number
  ) => {

    return await apiDelete(

      `/v1/admin/current-affairs/${affairId}/`
    );

};


// ======================================================
// 🔐 FORGOT PASSWORD
// ======================================================

export interface ForgotPasswordRequest {

  email: string;

}

export interface VerifyForgotPasswordOTPRequest {

  email: string;

  otp: string;

}

export interface ResetPasswordRequest {

  email: string;

  otp: string;

  new_password: string;

}

export const forgotPassword = async (
  data: ForgotPasswordRequest
) => {

  return await apiPost(
    '/accounts/forgot-password/',
    data
  );

};

export const verifyForgotPasswordOTP =
  async (
    data: VerifyForgotPasswordOTPRequest
  ) => {

    return await apiPost(
      '/accounts/forgot-password/verify-otp/',
      data
    );

  };

export const resetPassword =
  async (
    data: ResetPasswordRequest
  ) => {

    return await apiPost(
      '/accounts/forgot-password/reset/',
      data
    );

  };


// ======================================================
// 👨‍🏫 TUTOR APPLICATION
// ======================================================

export interface TutorApplication {

  id: number;

  full_name: string;

  email: string;

  phone: string;

  city_state: string;

  linkedin_profile: string;

  highest_qualification: string;

  degree: string;

  college_name: string;

  year_of_completion: number | null;

  skills: string;

  experience: number;

  expertise_level: string;

  current_status: string;

  organization: string;

  professional_summary: string;

  mentor_subjects: string[];

  mentor_languages: string[];

  resume: string | null;

  status:
    | 'pending'
    | 'approved'
    | 'rejected';

  admin_notes: string | null;

  submitted_at: string;

  reviewed_at: string | null;
}

// ======================================================
// 📝 SUBMIT TUTOR APPLICATION
// ======================================================

export const submitTutorApplication =
  async (
    formData: FormData
  ) => {

    return await apiPost(
      '/accounts/tutor/apply/',
      formData,
      {
        headers: {
          'Content-Type':
            'multipart/form-data',
        },
      }
    );

};

// ======================================================
// 👀 GET APPLICATION DETAIL
// ======================================================

export const getTutorApplication =
  async (
    applicationId: number
  ) => {

    return await apiGet(
      `/accounts/tutor/apply/${applicationId}/`
    );

};

// ======================================================
// 👨‍💼 ADMIN - ALL APPLICATIONS
// ======================================================

export const getTutorApplications =
  async () => {

    return await apiGet(
      '/accounts/v1/admin/tutor-applications/'
    );

};

// ======================================================
// 👨‍💼 ADMIN - APPLICATION DETAIL
// ======================================================

export const getTutorApplicationDetail =
  async (
    applicationId: number
  ) => {

    return await apiGet(
      `/accounts/v1/admin/tutor-applications/${applicationId}/`
    );

};

// ======================================================
// ✅ APPROVE APPLICATION
// ======================================================

export const approveTutorApplication =
  async (
    applicationId: number
  ) => {

    return await apiPost(
      `/accounts/v1/admin/tutor-applications/${applicationId}/approve/`,
      {}
    );

};

// ======================================================
// ❌ REJECT APPLICATION
// ======================================================

export const rejectTutorApplication =
  async (
    applicationId: number
  ) => {

    return await apiPost(
      `/accounts/v1/admin/tutor-applications/${applicationId}/reject/`,
      {}
    );

};





// ======================================================
// 🚨 REPORTS
// ======================================================

export type ReportReason =
  | "rude"
  | "late"
  | "poor_explanation"
  | "wrong_information"
  | "harassment"
  | "spam"
  | "other";

export type ReportStatus =
  | "pending"
  | "under_review"
  | "resolved"
  | "rejected";

// ======================================================
// 👨‍🎓 CREATE REPORT
// ======================================================

export interface CreateReportRequest {
  session_id: number;
  reason: ReportReason;
  description: string;
}

export const createReport = async (
  data: CreateReportRequest
) => {
  return await apiPost(
    "/v1/reports/create/",
    data
  );
};

// ======================================================
// 👨‍🎓 MY REPORTS
// ======================================================

export interface StudentReportFilters {
  page?: number;
  page_size?: number;
}

export const getMyReports = async (
  params?: StudentReportFilters
) => {
  return await apiGetWithParams(
    "/v1/reports/my-reports/",
    params
  );
};

// ======================================================
// 👨‍💼 ADMIN REPORTS
// ======================================================

export interface AdminReportFilters {

  status?: ReportStatus;

  reason?: ReportReason;

  search?: string;

  is_read?: boolean;

  page?: number;

  page_size?: number;

}

export const getAdminReports = async (
  params?: AdminReportFilters
) => {

  return await apiGetWithParams(
    "/v1/reports/admin/reports/",
    params
  );

};

// ======================================================
// 👨‍💼 REPORT DETAIL
// ======================================================

export const getAdminReportDetail = async (
  reportId: number
) => {

  return await apiGet(
    `/v1/reports/admin/reports/${reportId}/`
  );

};

// ======================================================
// 👨‍💼 UPDATE REPORT
// ======================================================

export interface UpdateReportRequest {

  status?: ReportStatus;

  admin_notes?: string;

}

export const updateAdminReport = async (

  reportId: number,

  data: UpdateReportRequest

) => {

  return await apiPatch(

    `/v1/reports/admin/reports/${reportId}/update/`,

    data

  );

};

// ======================================================
// 📊 REPORT ANALYTICS
// ======================================================

export const getReportAnalytics =
  async () => {

    return await apiGet(
      "/v1/reports/admin/reports/analytics/"
    );

};






























// ======================================================
// 🏦 TUTOR BANK VERIFICATION
// ======================================================

export type VerificationStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected";

// ============================================
// Tutor Bank Verification
// ============================================

export interface TutorBankVerification {

  account_holder_name: string;

  account_number: string;

  ifsc_code: string;

  bank_name: string;

  branch_name: string;

  account_type: "savings" | "current";

  pan_number: string;

  aadhaar_number?: string;

  mobile_number: string;

  bank_proof?: string;

  pan_card?: string;

  status: VerificationStatus;

  rejection_reason?: string;

}

export const getTutorBankVerification =
  async () => {

    return await apiGet(
      "/wallet/verification/"
    );

};

// ============================================
// Submit Verification
// ============================================

export const submitTutorBankVerification =
  async (
    formData: FormData
  ) => {

    return await apiPost(
      "/wallet/verification/",
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      }
    );

};

// ============================================
// Update Verification
// ============================================

export const updateTutorBankVerification =
  async (
    formData: FormData
  ) => {

    return await apiPut(
      "/wallet/verification/",
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      }
    );

};



// ======================================================
// 💸 TUTOR WITHDRAWALS
// ======================================================

export interface Withdrawal {

  withdrawal_id: number;

  amount: number;

  status:
    | "pending"
    | "processing"
    | "completed"
    | "rejected";

  admin_notes: string | null;

  created_at: string;

  processed_at: string | null;

}

export interface CreateWithdrawalRequest {

  amount: number;

}

// ============================================
// My Withdrawals
// ============================================

export const getMyWithdrawals =
  async () => {

    return await apiGet(
      "/wallet/withdrawals/"
    );

};

// ============================================
// Create Withdrawal
// ============================================

export const createWithdrawal =
  async (
    data: CreateWithdrawalRequest
  ) => {

    return await apiPost(
      "/wallet/withdrawals/",
      data
    );

};



// ======================================================
// 👨‍💼 ADMIN BANK VERIFICATIONS
// ======================================================

export interface AdminVerificationFilters {

  search?: string;

  status?: VerificationStatus;

  page?: number;

  page_size?: number;

}

// ============================================
// List
// ============================================

export const getAdminVerifications =
  async (
    params?: AdminVerificationFilters
  ) => {

    return await apiGetWithParams(
      "/wallet/admin/verifications/",
      params
    );

};

// ============================================
// Detail
// ============================================

export const getAdminVerificationDetail =
  async (
    verificationId: number
  ) => {

    return await apiGet(
      `/wallet/admin/verifications/${verificationId}/`
    );

};

// ============================================
// Update
// ============================================

export interface UpdateVerificationRequest {

  status:
    | "approved"
    | "rejected";

  rejection_reason?: string;

}

export const updateAdminVerification =
  async (
    verificationId: number,
    data: UpdateVerificationRequest
  ) => {

    return await apiPatch(
      `/wallet/admin/verifications/${verificationId}/update/`,
      data
    );

};



// ======================================================
// 👨‍💼 ADMIN WITHDRAWALS
// ======================================================

export interface AdminWithdrawalFilters {

  search?: string;

  status?:
    | "pending"
    | "processing"
    | "completed"
    | "rejected";

  page?: number;

  page_size?: number;

}

// ============================================
// List
// ============================================

export const getAdminWithdrawals =
  async (
    params?: AdminWithdrawalFilters
  ) => {

    return await apiGetWithParams(
      "/wallet/admin/withdrawals/",
      params
    );

};

// ============================================
// Detail
// ============================================

export const getAdminWithdrawalDetail =
  async (
    withdrawalId: number
  ) => {

    return await apiGet(
      `/wallet/admin/withdrawals/${withdrawalId}/`
    );

};

// ============================================
// Update
// ============================================

export interface UpdateWithdrawalRequest {

  status:
    | "processing"
    | "completed"
    | "rejected";

  admin_notes?: string;

}

export const updateAdminWithdrawal =
  async (
    withdrawalId: number,
    data: UpdateWithdrawalRequest
  ) => {

    return await apiPatch(
      `/wallet/admin/withdrawals/${withdrawalId}/update/`,
      data
    );

};



// ======================================================
// 👨‍🎓 STUDENT PROFILE
// ======================================================

export interface StudentProfile {
  id: number;

  full_name: string;

  email: string;

  mobile_number: string;

  profile_photo?: string;

  education_level: string;

  grade_year: string;

  stream_category: string;

  stream: string;

  preferred_languages: string[];

  subjects: string[];

  learning_goals: string[];

  session_types: string[];

  preferred_time: string[];

  skill_level: string;

  about_learning: string;

  profile_completed: boolean;

  created_at: string;

  updated_at: string;
}

// ======================================================
// 👨‍🎓 GET STUDENT PROFILE
// ======================================================

export const getStudentProfile =
  async (): Promise<{
    success: boolean;
    data: StudentProfile;
  }> => {

    return await apiGet(
      "/accounts/student/profile/"
    );

};

// ======================================================
// ✏️ UPDATE STUDENT PROFILE REQUEST
// ======================================================

export interface UpdateStudentProfileRequest {

  full_name?: string;

  email?: string;

  mobile_number?: string;

  education_level?: string;

  grade_year?: string;

  stream_category?: string;

  stream?: string;

  preferred_languages?: string[];

  subjects?: string[];

  learning_goals?: string[];

  session_types?: string[];

  preferred_time?: string[];

  skill_level?: string;

  about_learning?: string;

}

// ======================================================
// ✏️ UPDATE STUDENT PROFILE
// ======================================================

export const updateStudentProfile =
  async (
    data: FormData
  ) => {

    return await apiPut(
      "/accounts/student/profile/",
      data,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      }
    );

};

// ======================================================
// 📦 BUILD STUDENT PROFILE FORM DATA
// ======================================================

export const buildStudentProfileFormData = (
  form: UpdateStudentProfileRequest,
  profilePhoto?: File | null
) => {

  const formData = new FormData();

  Object.entries(form).forEach(([key, value]) => {

    if (
      value === undefined ||
      value === null
    ) {
      return;
    }

    if (Array.isArray(value)) {

      formData.append(
        key,
        JSON.stringify(value)
      );

    } else {

      formData.append(
        key,
        String(value)
      );

    }

  });

  if (profilePhoto) {

    formData.append(
      "profile_photo",
      profilePhoto
    );

  }

  return formData;

};

export const extendMatchingWait = async (
  doubtId: number
) => {
  return await apiPost(
    `/v1/student/doubts/${doubtId}/wait/`,
    {}
  );
};

export const requestStudentRefund = async (
  doubtId: number
) => {
  return await apiPost(
    `/v1/student/doubts/${doubtId}/refund/`,
    {}
  );
};