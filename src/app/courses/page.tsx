import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Online Courses | Learn Programming & More | KnowMato",
  description:
    "Explore online courses on KnowMato and learn programming, technology, and practical skills with structured courses designed for students and learners.",
  alternates: {
    canonical: "https://www.knowmato.in/courses",
  },
  openGraph: {
    title: "Online Courses | KnowMato",
    description:
      "Explore online courses on programming, technology, and practical skills with KnowMato.",
    url: "https://www.knowmato.in/courses",
    siteName: "KnowMato",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Online Courses | KnowMato",
    description:
      "Explore online courses on programming, technology, and practical skills with KnowMato.",
  },
};

type Course = {
  id: number;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  thumbnail: string;
  language: string;
  difficulty: string;
  course_type: string;
  duration_hours: number;
  total_sections: number;
  total_lectures: number;
  total_quizzes: number;
  total_students: number;
  average_rating: string;
  total_reviews: number;
  certificate_available: boolean;
  is_featured: boolean;
  is_trending: boolean;
  category_name: string;
  category_slug: string;
  instructor_name: string;
};

type CoursesResponse = {
  success: boolean;
  status: number;
  message: string;
  data: Course[];
};

const API_URL =
  "https://api.knowmato.in/api/v2/public/courses/";

async function getCourses(): Promise<Course[]> {
  try {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: 300,
      },
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch public courses: ${response.status}`
      );

      return [];
    }

    const result: CoursesResponse = await response.json();

    if (!result.success || !Array.isArray(result.data)) {
      return [];
    }

    return result.data;
  } catch (error) {
    console.error("Public courses fetch error:", error);

    return [];
  }
}

function getDifficultyLabel(difficulty: string): string {
  if (!difficulty) {
    return "";
  }

  return difficulty
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

export default async function CoursesPage() {
  const courses = await getCourses();

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
        className="pointer-events-none absolute bottom-[-140px] left-[25%] h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[15%] top-[40%] h-64 w-64 rounded-full bg-violet-500/10 blur-3xl"
      />

      {/* ============================================================
          MAIN CONTENT
      ============================================================ */}

      <div className="relative z-10">
        {/* ============================================================
            HERO
        ============================================================ */}

        <section className="px-4 pb-8 pt-6 sm:px-6 lg:px-8 lg:pt-10">
          <div className="mx-auto max-w-7xl">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8 lg:p-10">
              {/* Hero glow */}
              <div
                aria-hidden="true"
                className="absolute right-[-50px] top-[-70px] h-52 w-52 rounded-full bg-gradient-to-br from-violet-500/25 to-fuchsia-500/20 blur-3xl"
              />

              <div
                aria-hidden="true"
                className="absolute bottom-[-80px] left-[35%] h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl"
              />

              <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1fr_320px]">
                {/* Hero text */}
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-violet-300">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
                    KnowMato Courses
                  </div>

                  <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                    <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                      Learn.
                    </span>{" "}
                    <span className="text-white">Build.</span>{" "}
                    <span className="bg-gradient-to-r from-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                      Grow.
                    </span>
                  </h1>

                  <p className="mt-5 max-w-2xl text-base leading-7 text-white/65 sm:text-lg sm:leading-8">
                    Explore structured online courses designed to help you
                    build practical knowledge, strengthen your technical
                    skills, and learn at your own pace.
                  </p>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <a
                      href="#available-courses"
                      className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.02] hover:from-violet-600 hover:to-fuchsia-600 hover:shadow-xl hover:shadow-violet-500/30 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-[#211d48]"
                    >
                      Explore Courses
                    </a>

                    <Link
                      href="/register"
                      className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/85 transition-all hover:border-violet-400/40 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-[#211d48]"
                    >
                      Join KnowMato
                    </Link>
                  </div>
                </div>

                {/* Hero visual */}
                <div className="hidden lg:flex lg:justify-center">
                  <div className="relative flex h-56 w-56 items-center justify-center">
                    <div
                      aria-hidden="true"
                      className="absolute inset-4 rounded-full bg-gradient-to-br from-violet-500/30 via-fuchsia-500/20 to-cyan-500/20 blur-2xl"
                    />

                    <div className="relative flex h-40 w-40 items-center justify-center rounded-[2rem] border border-white/10 bg-white/10 shadow-2xl backdrop-blur-xl">
                      <div className="text-center">
                        <div className="text-6xl">🎓</div>

                        <p className="mt-3 text-xs font-bold uppercase tracking-widest text-white/60">
                          Learn with
                        </p>

                        <p className="mt-1 text-sm font-bold text-white">
                          KnowMato
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            COURSE SECTION
        ============================================================ */}

        <section
          id="available-courses"
          aria-labelledby="courses-heading"
          className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10"
        >
          <div className="mx-auto max-w-7xl">
            {/* Section heading */}
            <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 rounded-full bg-gradient-to-b from-violet-400 to-fuchsia-500" />

                  <h2
                    id="courses-heading"
                    className="text-2xl font-bold tracking-tight text-white sm:text-3xl"
                  >
                    Explore our courses
                  </h2>
                </div>

                <p className="mt-2 pl-4 text-sm text-white/50 sm:text-base">
                  Discover practical courses available on KnowMato.
                </p>
              </div>

              {courses.length > 0 && (
                <div className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/60 backdrop-blur-md">
                  {courses.length}{" "}
                  {courses.length === 1 ? "course" : "courses"} available
                </div>
              )}
            </div>

            {/* ========================================================
                EMPTY STATE
            ======================================================== */}

            {courses.length === 0 ? (
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-10 text-center shadow-2xl backdrop-blur-xl sm:p-14">
                <div
                  aria-hidden="true"
                  className="absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl"
                />

                <div className="relative z-10">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-violet-400/20 bg-violet-500/10 text-4xl">
                    📚
                  </div>

                  <h2 className="mt-6 text-2xl font-bold text-white">
                    Courses are currently unavailable
                  </h2>

                  <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/50">
                    We&apos;re preparing more learning experiences for you.
                    Please check back soon for available courses.
                  </p>

                  <Link
                    href="/"
                    className="mt-7 inline-flex rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/80 transition-all hover:border-violet-400/40 hover:bg-white/10 hover:text-white"
                  >
                    Back to KnowMato
                  </Link>
                </div>
              </div>
            ) : (
              /* ======================================================
                 COURSE GRID
              ======================================================= */

              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {courses.map((course) => (
                  <article
                    key={course.id}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/30 hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-violet-500/10"
                  >
                    {/* =================================================
                        COURSE IMAGE
                    ================================================== */}

                    <Link
                      href={`/courses/${course.slug}`}
                      aria-label={`View ${course.title}`}
                      className="block"
                    >
                      <div className="relative aspect-video overflow-hidden bg-black/20">
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail}
                            alt={`${course.title} online course`}
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-violet-500/20 via-fuchsia-500/10 to-cyan-500/10">
                            <div className="text-center">
                              <div className="text-5xl">📚</div>

                              <span className="mt-2 block text-xs font-semibold text-white/40">
                                KnowMato Course
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Image overlay */}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0f0c29]/70 via-transparent to-transparent opacity-70" />

                        {/* Featured / Trending */}
                        {course.is_featured && (
                          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-violet-300/30 bg-violet-500/20 px-3 py-1.5 text-[11px] font-bold text-violet-200 shadow-lg backdrop-blur-md">
                            ⭐ Featured
                          </span>
                        )}

                        {!course.is_featured && course.is_trending && (
                          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-fuchsia-300/30 bg-fuchsia-500/20 px-3 py-1.5 text-[11px] font-bold text-fuchsia-200 shadow-lg backdrop-blur-md">
                            🔥 Trending
                          </span>
                        )}

                        {/* Difficulty */}
                        {course.difficulty && (
                          <span className="absolute bottom-4 right-4 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-[10px] font-bold text-white/80 backdrop-blur-md">
                            {getDifficultyLabel(course.difficulty)}
                          </span>
                        )}
                      </div>
                    </Link>

                    {/* =================================================
                        COURSE CONTENT
                    ================================================== */}

                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      {/* Category */}
                      <div className="flex flex-wrap items-center gap-2">
                        {course.category_name && (
                          <span className="rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-300">
                            {course.category_name}
                          </span>
                        )}

                        {course.language && (
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold text-white/50">
                            🌐 {course.language}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="mt-4 text-xl font-bold leading-7 text-white">
                        <Link
                          href={`/courses/${course.slug}`}
                          className="transition-colors hover:text-violet-300"
                        >
                          {course.title}
                        </Link>
                      </h3>

                      {/* Subtitle */}
                      {course.subtitle && (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/55">
                          {course.subtitle}
                        </p>
                      )}

                      {/* Description */}
                      {course.description && (
                        <p className="mt-3 line-clamp-3 text-xs leading-5 text-white/40">
                          {course.description}
                        </p>
                      )}

                      {/* Certificate */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {course.certificate_available && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold text-emerald-300">
                            ✓ Certificate available
                          </span>
                        )}

                        {course.total_quizzes > 0 && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-[10px] font-bold text-cyan-300">
                            📝 {course.total_quizzes}{" "}
                            {course.total_quizzes === 1
                              ? "quiz"
                              : "quizzes"}
                          </span>
                        )}
                      </div>

                      {/* Rating */}
                      {Number(course.average_rating) > 0 && (
                        <div className="mt-4 flex items-center gap-2">
                          <span className="text-sm font-bold text-amber-300">
                            ★ {course.average_rating}
                          </span>

                          <span className="text-xs text-white/40">
                            ({course.total_reviews}{" "}
                            {course.total_reviews === 1
                              ? "review"
                              : "reviews"})
                          </span>
                        </div>
                      )}

                      {/* Instructor */}
                      {course.instructor_name && (
                        <div className="mt-4 flex items-center gap-2 text-xs text-white/45">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-[10px] font-bold text-white">
                            {course.instructor_name
                              .charAt(0)
                              .toUpperCase()}
                          </span>

                          <span>
                            By{" "}
                            <span className="font-semibold text-white/65">
                              {course.instructor_name}
                            </span>
                          </span>
                        </div>
                      )}

                      {/* =================================================
                          CTA
                      ================================================== */}

                      <div className="mt-auto pt-6">
                        <Link
                          href={`/courses/${course.slug}`}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition-all duration-200 hover:scale-[1.01] hover:from-violet-600 hover:to-fuchsia-600 hover:shadow-xl hover:shadow-violet-500/30 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-[#211d48]"
                        >
                          View Course

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
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ============================================================
            WHY KNOWMATO
        ============================================================ */}

        <section className="px-4 pb-10 pt-4 sm:px-6 lg:px-8 lg:pb-16">
          <div className="mx-auto max-w-7xl">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8 lg:p-10">
              <div
                aria-hidden="true"
                className="absolute right-[-80px] top-[-100px] h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl"
              />

              <div className="relative z-10">
                <div className="max-w-3xl">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">
                    Learn with KnowMato
                  </p>

                  <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
                    Build practical skills for your learning journey
                  </h2>

                  <p className="mt-4 text-sm leading-7 text-white/50 sm:text-base">
                    KnowMato provides structured online courses that help
                    students and learners develop practical technical skills.
                    Explore programming and technology-focused subjects and
                    choose courses that match your learning goals.
                  </p>
                </div>

                <div className="mt-7 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-xl">
                      🎯
                    </div>

                    <h3 className="mt-4 font-bold text-white">
                      Practical Learning
                    </h3>

                    <p className="mt-2 text-xs leading-6 text-white/40">
                      Focus on useful knowledge and skills you can apply.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-fuchsia-500/15 text-xl">
                      🚀
                    </div>

                    <h3 className="mt-4 font-bold text-white">
                      Learn at Your Pace
                    </h3>

                    <p className="mt-2 text-xs leading-6 text-white/40">
                      Study course material according to your own learning
                      journey.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/15 text-xl">
                      🏆
                    </div>

                    <h3 className="mt-4 font-bold text-white">
                      Grow Your Skills
                    </h3>

                    <p className="mt-2 text-xs leading-6 text-white/40">
                      Strengthen your technical knowledge through structured
                      courses.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            FINAL CTA
        ============================================================ */}

        <section className="px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-xl sm:p-12">
              <div
                aria-hidden="true"
                className="absolute left-1/2 top-[-100px] h-56 w-56 -translate-x-1/2 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 blur-3xl"
              />

              <div className="relative z-10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-3xl">
                  🚀
                </div>

                <h2 className="mt-5 text-2xl font-bold text-white sm:text-3xl">
                  Ready to start learning?
                </h2>

                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/50">
                  Join KnowMato and explore courses designed to help you
                  strengthen your knowledge and build practical skills.
                </p>

                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link
                    href="/register"
                    className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.02] hover:from-violet-600 hover:to-fuchsia-600"
                  >
                    Get Started
                  </Link>

                  <Link
                    href="/login"
                    className="rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white/75 transition-all hover:border-violet-400/40 hover:bg-white/10 hover:text-white"
                  >
                    Already have an account? Log in
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