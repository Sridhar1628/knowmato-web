import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Course = {
  id: number;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  thumbnail: string;
  trailer_video: string;
  language: string;
  difficulty: string;
  course_type: string;
  total_sections: number;
  total_lectures: number;
  total_quizzes: number;
  total_students: number;
  average_rating: string;
  total_reviews: number;
  prerequisites: string;
  learning_outcomes: string;
  target_audience: string;
  certificate_available: boolean;
  is_featured: boolean;
  is_trending: boolean;
  category_name: string;
  category_slug: string;
  instructor_name: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type CourseResponse = {
  success: boolean;
  status: number;
  message: string;
  data: Course | null;
};

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const API_BASE_URL =
  "https://api.knowmato.in/api/v2/public/courses";

const SITE_URL = "https://www.knowmato.in";

async function getCourse(
  slug: string,
): Promise<Course | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/${encodeURIComponent(slug)}/`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        next: {
          revalidate: 300,
        },
      },
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      console.error(
        `Failed to fetch course ${slug}: ${response.status}`,
      );

      return null;
    }

    const result: CourseResponse =
      await response.json();

    if (!result.success || !result.data) {
      return null;
    }

    return result.data;
  } catch (error) {
    console.error(
      "Public course detail fetch error:",
      error,
    );

    return null;
  }
}

function formatText(value: string): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(/\r?\n|•|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDifficulty(value: string): string {
  if (!value) {
    return "";
  }

  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatCourseType(value: string): string {
  if (!value) {
    return "";
  }

  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const course = await getCourse(slug);

  if (!course) {
    return {
      title: "Course Not Found",
      description:
        "The requested KnowMato course could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description =
    course.description ||
    course.subtitle ||
    `Learn ${course.title} with KnowMato.`;

  const canonicalUrl =
    `${SITE_URL}/courses/${course.slug}`;

  return {
    /*
     * IMPORTANT:
     * Do NOT add "| KnowMato" here.
     *
     * The root layout title template should handle
     * the "| KnowMato" suffix.
     *
     * This prevents:
     * "Course | KnowMato | KnowMato"
     */
    title: course.title,

    description,

    alternates: {
      canonical: canonicalUrl,
    },

    openGraph: {
      title: course.title,
      description,
      url: canonicalUrl,
      siteName: "KnowMato",
      type: "website",

      ...(course.thumbnail
        ? {
            images: [
              {
                url: course.thumbnail,
                width: 1200,
                height: 630,
                alt: `${course.title} course`,
              },
            ],
          }
        : {}),
    },

    twitter: {
      card: "summary_large_image",
      title: course.title,
      description,

      ...(course.thumbnail
        ? {
            images: [course.thumbnail],
          }
        : {}),
    },
  };
}

export default async function PublicCoursePage({
  params,
}: PageProps) {
  const { slug } = await params;

  const course = await getCourse(slug);

  if (!course) {
    notFound();
  }

  const learningOutcomes = formatText(
    course.learning_outcomes,
  );

  const prerequisites = formatText(
    course.prerequisites,
  );

  const targetAudience = formatText(
    course.target_audience,
  );

  const canonicalUrl =
    `${SITE_URL}/courses/${course.slug}`;

  /*
   * ============================================================
   * STRUCTURED DATA
   * ============================================================
   *
   * No monetary price is exposed here.
   *
   * Duration is also intentionally not included.
   */
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Course",

    name: course.title,

    description:
      course.description ||
      course.subtitle ||
      `Learn ${course.title} with KnowMato.`,

    url: canonicalUrl,

    provider: {
      "@type": "Organization",
      name: "KnowMato",
      url: SITE_URL,
    },

    ...(course.instructor_name
      ? {
          instructor: {
            "@type": "Person",
            name: course.instructor_name,
          },
        }
      : {}),

    ...(course.thumbnail
      ? {
          image: course.thumbnail,
        }
      : {}),

    ...(course.language
      ? {
          inLanguage: course.language,
        }
      : {}),

    ...(course.average_rating &&
    Number(course.average_rating) > 0 &&
    course.total_reviews > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(
              course.average_rating,
            ),
            reviewCount: course.total_reviews,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${SITE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Courses",
        item: `${SITE_URL}/courses`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: course.title,
      },
    ],
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">

      {/* ============================================================
          BACKGROUND GLOW EFFECTS
      ============================================================ */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[-120px] top-[-100px] h-80 w-80 rounded-full bg-purple-500/20 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-120px] top-[-50px] h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-150px] left-[25%] h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[20%] top-[35%] h-72 w-72 rounded-full bg-violet-500/10 blur-3xl"
      />

      {/* ============================================================
          STRUCTURED DATA
      ============================================================ */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbData),
        }}
      />

      <div className="relative z-10">

        {/* ============================================================
            BREADCRUMB
        ============================================================ */}

        <nav
          aria-label="Breadcrumb"
          className="border-b border-white/10 bg-white/[0.03] backdrop-blur-xl"
        >
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <ol className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">

              <li>
                <Link
                  href="/"
                  className="text-white/45 transition hover:text-violet-300"
                >
                  Home
                </Link>
              </li>

              <li
                aria-hidden="true"
                className="text-white/20"
              >
                /
              </li>

              <li>
                <Link
                  href="/courses"
                  className="text-white/45 transition hover:text-violet-300"
                >
                  Courses
                </Link>
              </li>

              <li
                aria-hidden="true"
                className="text-white/20"
              >
                /
              </li>

              <li
                aria-current="page"
                className="max-w-[220px] truncate font-medium text-white/75 sm:max-w-none"
              >
                {course.title}
              </li>

            </ol>
          </div>
        </nav>

        {/* ============================================================
            COURSE HERO
        ============================================================ */}

        <section className="px-4 pb-8 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-10">
          <div className="mx-auto max-w-7xl">

            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8 lg:p-10">

              {/* Card glows */}

              <div
                aria-hidden="true"
                className="absolute right-[-70px] top-[-80px] h-60 w-60 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 blur-3xl"
              />

              <div
                aria-hidden="true"
                className="absolute bottom-[-100px] left-[30%] h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl"
              />

              <div className="relative z-10 grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start">

                {/* ======================================================
                    MAIN INFORMATION
                ======================================================= */}

                <div>

                  {/* Tags */}

                  <div className="flex flex-wrap items-center gap-2">

                    {course.category_name && (
                      <span className="rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-violet-300">
                        {course.category_name}
                      </span>
                    )}

                    {course.difficulty && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold text-white/55">
                        {formatDifficulty(
                          course.difficulty,
                        )}
                      </span>
                    )}

                    {course.is_featured && (
                      <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 text-[10px] font-bold text-amber-300">
                        ⭐ Featured
                      </span>
                    )}

                    {!course.is_featured &&
                      course.is_trending && (
                        <span className="rounded-full border border-fuchsia-400/25 bg-fuchsia-400/10 px-3 py-1.5 text-[10px] font-bold text-fuchsia-300">
                          🔥 Trending
                        </span>
                      )}

                  </div>

                  {/* H1 */}

                  <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                    <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                      {course.title}
                    </span>
                  </h1>

                  {/* Subtitle */}

                  {course.subtitle && (
                    <p className="mt-5 max-w-3xl text-lg leading-8 text-white/65 sm:text-xl">
                      {course.subtitle}
                    </p>
                  )}

                  {/* Description */}

                  {course.description && (
                    <p className="mt-5 max-w-4xl whitespace-pre-line text-sm leading-7 text-white/50 sm:text-base sm:leading-8">
                      {course.description}
                    </p>
                  )}

                  {/* ====================================================
                      COURSE STATS
                  ===================================================== */}

                  <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">

                    {/* Difficulty */}

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                      <div className="text-xl">
                        🎯
                      </div>

                      <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-white/35">
                        Difficulty
                      </p>

                      <p className="mt-1 text-sm font-bold text-white/85">
                        {formatDifficulty(
                          course.difficulty,
                        )}
                      </p>
                    </div>

                    {/* Language */}

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                      <div className="text-xl">
                        🌐
                      </div>

                      <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-white/35">
                        Language
                      </p>

                      <p className="mt-1 text-sm font-bold text-white/85">
                        {course.language ||
                          "English"}
                      </p>
                    </div>

                    {/* Certificate */}

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                      <div className="text-xl">
                        🏆
                      </div>

                      <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-white/35">
                        Certificate
                      </p>

                      <p className="mt-1 text-sm font-bold text-white/85">
                        {course.certificate_available
                          ? "Available"
                          : "Not available"}
                      </p>
                    </div>

                  </div>

                  {/* ====================================================
                      INSTRUCTOR
                  ===================================================== */}

                  {course.instructor_name && (
                    <div className="mt-7 flex items-center gap-3">

                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-bold text-white shadow-lg shadow-violet-500/20">
                        {course.instructor_name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>

                        <p className="text-[10px] font-semibold uppercase tracking-wide text-white/35">
                          Instructor
                        </p>

                        <p className="mt-0.5 text-sm font-bold text-white/80">
                          {course.instructor_name}
                        </p>

                      </div>

                    </div>
                  )}

                </div>

                {/* ======================================================
                    REGISTRATION CARD
                ======================================================= */}

                <aside className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">

                  {course.thumbnail ? (
                    <div className="relative aspect-video overflow-hidden bg-black/20">

                      <img
                        src={course.thumbnail}
                        alt={`${course.title} course`}
                        className="h-full w-full object-cover"
                      />

                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0f0c29]/80 via-transparent to-transparent" />

                    </div>
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-violet-500/20 via-fuchsia-500/10 to-cyan-500/10">

                      <div className="text-center">

                        <div className="text-6xl">
                          📚
                        </div>

                        <p className="mt-2 text-xs font-semibold text-white/40">
                          KnowMato Course
                        </p>

                      </div>

                    </div>
                  )}

                  <div className="p-6">

                    <h2 className="text-xl font-bold text-white">
                      Interested in this course?
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-white/50">
                      Register with KnowMato to
                      access more course details
                      and continue your learning
                      journey.
                    </p>

                    <Link
                      href="/register"
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.01] hover:from-violet-600 hover:to-fuchsia-600 hover:shadow-xl hover:shadow-violet-500/30 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-[#211d48]"
                    >
                      Register for More Details

                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </Link>

                    <p className="mt-3 text-center text-xs leading-5 text-white/35">
                      Already have an account?{" "}
                      <Link
                        href="/login"
                        className="font-semibold text-violet-300 transition hover:text-violet-200"
                      >
                        Log in
                      </Link>
                    </p>

                    {/* Course statistics */}

                    <div className="mt-6 border-t border-white/10 pt-6">

                      <ul className="space-y-3 text-sm">

                        <li className="flex items-center justify-between gap-4">
                          <span className="text-white/40">
                            Sections
                          </span>

                          <span className="font-bold text-white/80">
                            {course.total_sections}
                          </span>
                        </li>

                        <li className="flex items-center justify-between gap-4">
                          <span className="text-white/40">
                            Lectures
                          </span>

                          <span className="font-bold text-white/80">
                            {course.total_lectures}
                          </span>
                        </li>

                        <li className="flex items-center justify-between gap-4">
                          <span className="text-white/40">
                            Quizzes
                          </span>

                          <span className="font-bold text-white/80">
                            {course.total_quizzes}
                          </span>
                        </li>

                        {course.total_students > 0 && (
                          <li className="flex items-center justify-between gap-4">
                            <span className="text-white/40">
                              Students
                            </span>

                            <span className="font-bold text-white/80">
                              {course.total_students}
                            </span>
                          </li>
                        )}

                      </ul>

                    </div>

                  </div>

                </aside>

              </div>

            </div>

          </div>
        </section>

        {/* ============================================================
            RATING
        ============================================================ */}

        {Number(course.average_rating) > 0 &&
          course.total_reviews > 0 && (
            <section className="px-4 pb-8 sm:px-6 lg:px-8">

              <div className="mx-auto max-w-7xl">

                <div className="flex items-center gap-4 rounded-2xl border border-amber-400/15 bg-amber-400/5 px-5 py-4 backdrop-blur-md">

                  <div className="text-2xl text-amber-300">
                    ★
                  </div>

                  <div>

                    <p className="text-lg font-bold text-white">
                      {course.average_rating}
                    </p>

                    <p className="text-xs text-white/40">
                      Based on{" "}
                      {course.total_reviews}{" "}
                      {course.total_reviews === 1
                        ? "review"
                        : "reviews"}
                    </p>

                  </div>

                </div>

              </div>

            </section>
          )}

        {/* ============================================================
            COURSE DETAILS
        ============================================================ */}

        <section className="px-4 py-8 sm:px-6 lg:px-8 lg:py-12">

          <div className="mx-auto max-w-7xl">

            <div className="grid gap-8 lg:grid-cols-[1fr_320px]">

              {/* ======================================================
                  MAIN DETAILS
              ======================================================= */}

              <div className="space-y-8">

                {/* About */}

                <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl sm:p-8">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-lg">
                      📖
                    </div>

                    <h2 className="text-2xl font-bold text-white">
                      About this course
                    </h2>

                  </div>

                  <p className="mt-5 whitespace-pre-line text-sm leading-7 text-white/55 sm:text-base sm:leading-8">
                    {course.description}
                  </p>

                </section>

                {/* Learning Outcomes */}

                {learningOutcomes.length > 0 && (
                  <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl sm:p-8">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-500/15 text-lg">
                        🚀
                      </div>

                      <div>

                        <h2 className="text-2xl font-bold text-white">
                          What you will learn
                        </h2>

                        <p className="mt-1 text-xs text-white/40">
                          Skills and knowledge covered
                          in this course
                        </p>

                      </div>

                    </div>

                    <ul className="mt-6 grid gap-3 sm:grid-cols-2">

                      {learningOutcomes.map(
                        (outcome, index) => (
                          <li
                            key={`${outcome}-${index}`}
                            className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-violet-400/25 hover:bg-white/[0.07]"
                          >

                            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-xs font-bold text-emerald-300">
                              ✓
                            </span>

                            <span className="text-sm leading-6 text-white/65">
                              {outcome}
                            </span>

                          </li>
                        ),
                      )}

                    </ul>

                  </section>
                )}

                {/* Prerequisites */}

                {prerequisites.length > 0 && (
                  <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl sm:p-8">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 text-lg">
                        🧩
                      </div>

                      <div>

                        <h2 className="text-2xl font-bold text-white">
                          Prerequisites
                        </h2>

                        <p className="mt-1 text-xs text-white/40">
                          What you should know before
                          starting
                        </p>

                      </div>

                    </div>

                    <ul className="mt-6 space-y-3">

                      {prerequisites.map(
                        (item, index) => (
                          <li
                            key={`${item}-${index}`}
                            className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
                          >

                            <span className="mt-1 text-cyan-300">
                              •
                            </span>

                            <span className="text-sm leading-6 text-white/60">
                              {item}
                            </span>

                          </li>
                        ),
                      )}

                    </ul>

                  </section>
                )}

                {/* Target Audience */}

                {targetAudience.length > 0 && (
                  <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl sm:p-8">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-lg">
                        👥
                      </div>

                      <div>

                        <h2 className="text-2xl font-bold text-white">
                          Who this course is for
                        </h2>

                        <p className="mt-1 text-xs text-white/40">
                          Learners who can benefit
                          from this course
                        </p>

                      </div>

                    </div>

                    <ul className="mt-6 space-y-3">

                      {targetAudience.map(
                        (item, index) => (
                          <li
                            key={`${item}-${index}`}
                            className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
                          >

                            <span className="mt-1 text-violet-300">
                              •
                            </span>

                            <span className="text-sm leading-6 text-white/60">
                              {item}
                            </span>

                          </li>
                        ),
                      )}

                    </ul>

                  </section>
                )}

                {/* Certificate */}

                {course.certificate_available && (
                  <section className="relative overflow-hidden rounded-3xl border border-emerald-400/15 bg-emerald-400/5 p-6 shadow-xl backdrop-blur-xl sm:p-8">

                    <div
                      aria-hidden="true"
                      className="absolute right-[-50px] top-[-50px] h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl"
                    />

                    <div className="relative z-10 flex gap-4">

                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-400/15 text-2xl">
                        🏆
                      </div>

                      <div>

                        <h2 className="text-xl font-bold text-white">
                          Certificate of completion
                        </h2>

                        <p className="mt-2 text-sm leading-7 text-white/50">
                          This course provides a
                          certificate of completion
                          for eligible learners.
                        </p>

                      </div>

                    </div>

                  </section>
                )}

              </div>

              {/* ======================================================
                  SIDEBAR
              ======================================================= */}

              <aside className="h-fit rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl lg:sticky lg:top-6">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-lg">
                    ℹ️
                  </div>

                  <h2 className="text-lg font-bold text-white">
                    Course information
                  </h2>

                </div>

                <dl className="mt-6 space-y-4 text-sm">

                  {/* Category */}

                  <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">

                    <dt className="text-white/40">
                      Category
                    </dt>

                    <dd className="text-right font-semibold text-white/80">
                      {course.category_name ||
                        "—"}
                    </dd>

                  </div>

                  {/* Difficulty */}

                  <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">

                    <dt className="text-white/40">
                      Difficulty
                    </dt>

                    <dd className="text-right font-semibold text-white/80">
                      {formatDifficulty(
                        course.difficulty,
                      ) || "—"}
                    </dd>

                  </div>

                  {/* Language */}

                  <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">

                    <dt className="text-white/40">
                      Language
                    </dt>

                    <dd className="text-right font-semibold text-white/80">
                      {course.language || "—"}
                    </dd>

                  </div>

                  {/* Course Type */}

                  <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">

                    <dt className="text-white/40">
                      Course type
                    </dt>

                    <dd className="text-right font-semibold text-white/80">
                      {formatCourseType(
                        course.course_type,
                      ) || "—"}
                    </dd>

                  </div>

                  {/* Certificate */}

                  <div className="flex items-start justify-between gap-4">

                    <dt className="text-white/40">
                      Certificate
                    </dt>

                    <dd className="text-right font-semibold text-white/80">
                      {course.certificate_available
                        ? "Yes"
                        : "No"}
                    </dd>

                  </div>

                </dl>

                {/* Sidebar CTA */}

                <div className="mt-7 border-t border-white/10 pt-6">

                  <p className="mb-4 text-xs leading-5 text-white/40">
                    Register with KnowMato to
                    access more details about
                    this course.
                  </p>

                  <Link
                    href="/register"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.01] hover:from-violet-600 hover:to-fuchsia-600"
                  >
                    Register for More Details
                    <span>→</span>
                  </Link>

                </div>

              </aside>

            </div>

          </div>

        </section>

        {/* ============================================================
            BOTTOM CTA
        ============================================================ */}

        <section className="px-4 pb-16 pt-4 sm:px-6 lg:px-8">

          <div className="mx-auto max-w-5xl">

            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-xl sm:p-12">

              <div
                aria-hidden="true"
                className="absolute left-1/2 top-[-100px] h-64 w-64 -translate-x-1/2 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 blur-3xl"
              />

              <div className="relative z-10">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-3xl">
                  🚀
                </div>

                <h2 className="mt-5 text-2xl font-bold text-white sm:text-3xl">
                  Ready to start learning?
                </h2>

                <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/50">
                  Register with KnowMato to
                  access more details about this
                  course and continue your
                  learning journey.
                </p>

                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">

                  <Link
                    href="/register"
                    className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.02] hover:from-violet-600 hover:to-fuchsia-600"
                  >
                    Register for More Details
                  </Link>

                  <Link
                    href="/courses"
                    className="rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white/75 transition-all hover:border-violet-400/40 hover:bg-white/10 hover:text-white"
                  >
                    Browse More Courses
                  </Link>

                </div>

              </div>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}