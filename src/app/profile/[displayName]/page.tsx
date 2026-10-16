"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Award,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Copy,
  ExternalLink,
  GraduationCap,
  Link2,
  Loader2,
  Menu,
  MessageCircleQuestion,
  RefreshCw,
  Share2,
  Sparkles,
  Trophy,
  UserRound,
  X,
} from "lucide-react";

import { API_HOST } from "@/config/env";

type AnyRecord = Record<string, any>;

interface PublicProfileResponse {
  success?: boolean;
  status?: number;
  message?: string;
  data?: {
    profile?: AnyRecord | null;
    statistics?: AnyRecord | null;
    courses?: AnyRecord[] | null;
    certificates?: AnyRecord[] | null;
    assessments?: AnyRecord[] | null;
    doubts?: AnyRecord[] | null;
    internships?: AnyRecord[] | null;
    jobs?: AnyRecord[] | null;
    achievements?: AnyRecord[] | null;
  };
}

interface PublicProfileData {
  profile: AnyRecord;
  statistics: AnyRecord;
  courses: AnyRecord[];
  certificates: AnyRecord[];
  assessments: AnyRecord[];
  doubts: AnyRecord[];
  internships: AnyRecord[];
  jobs: AnyRecord[];
  achievements: AnyRecord[];
}

const SECTION_META = [
  {
    key: "courses",
    title: "Courses",
    icon: BookOpen,
    description: "Learning completed or pursued on KnowMato.",
  },
  {
    key: "certificates",
    title: "Certificates",
    icon: Award,
    description: "Certificates earned through learning and assessments.",
  },
  {
    key: "assessments",
    title: "Assessments",
    icon: ClipboardCheck,
    description: "Publicly shareable assessment achievements.",
  },
  {
    key: "doubts",
    title: "Doubts",
    icon: MessageCircleQuestion,
    description: "Learning activity and topics explored through doubt solving.",
  },
  {
    key: "internships",
    title: "Internships",
    icon: GraduationCap,
    description: "Internship experience shared on the profile.",
  },
  {
    key: "jobs",
    title: "Jobs",
    icon: BriefcaseBusiness,
    description: "Professional opportunities and experience.",
  },
  {
    key: "achievements",
    title: "Achievements",
    icon: Trophy,
    description: "Highlights and achievements.",
  },
] as const;

function firstValue(record: AnyRecord | null | undefined, keys: string[]): any {
  if (!record) return undefined;

  for (const key of keys) {
    const value = record[key];

    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return undefined;
}

function stringValue(
  record: AnyRecord | null | undefined,
  keys: string[],
  fallback = "",
): string {
  const value = firstValue(record, keys);

  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);

  return fallback;
}

function numberValue(
  record: AnyRecord | null | undefined,
  keys: string[],
  fallback = 0,
): number {
  const value = firstValue(record, keys);
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function arrayValue(value: unknown): AnyRecord[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is AnyRecord =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
}

function textArrayValue(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();

      if (item && typeof item === "object") {
        return stringValue(item as AnyRecord, [
          "name",
          "title",
          "label",
          "value",
        ]);
      }

      return "";
    })
    .filter(Boolean);
}

function formatDate(value: unknown): string {
  if (!value) return "";

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "";

  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "object" && item !== null
          ? stringValue(item as AnyRecord, [
              "name",
              "title",
              "label",
              "value",
            ])
          : String(item),
      )
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    return stringValue(value as AnyRecord, [
      "name",
      "title",
      "label",
      "value",
    ]);
  }

  return String(value);
}

function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) return "U";

  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

function getPhotoUrl(photo: unknown): string | null {
  if (!photo || typeof photo !== "string") return null;

  const value = photo.trim();

  if (!value) return null;

  if (/^https?:\/\//i.test(value)) return value;

  const host = String(API_HOST || "").replace(/\/+$/, "");
  const path = value.startsWith("/") ? value : `/${value}`;

  return `${host}${path}`;
}

function normalizeResponse(payload: PublicProfileResponse): PublicProfileData {
  const source = payload?.data ?? {};

  return {
    profile: source.profile ?? {},
    statistics: source.statistics ?? {},
    courses: arrayValue(source.courses),
    certificates: arrayValue(source.certificates),
    assessments: arrayValue(source.assessments),
    doubts: arrayValue(source.doubts),
    internships: arrayValue(source.internships),
    jobs: arrayValue(source.jobs),
    achievements: arrayValue(source.achievements),
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unable to load this public profile.";
}

function getItemTitle(item: AnyRecord, section: string): string {
  switch (section) {
    case "courses":
      return (
        stringValue(item, [
          "course_name",
          "course_title",
          "title",
          "name",
          "course",
        ]) || "Course"
      );

    case "certificates":
      return (
        stringValue(item, [
          "certificate_name",
          "certificate_title",
          "course_name",
          "title",
          "name",
        ]) || "Certificate"
      );

    case "assessments":
      return (
        stringValue(item, [
          "assessment_name",
          "assessment_title",
          "quiz_title",
          "title",
          "name",
        ]) || "Assessment"
      );

    case "doubts":
      return (
        stringValue(item, [
          "subject",
          "category_name",
          "category",
          "title",
          "topic",
        ]) || "Learning Doubt"
      );

    case "internships":
      return (
        stringValue(item, [
          "internship_title",
          "program_name",
          "title",
          "name",
          "role",
        ]) || "Internship"
      );

    case "jobs":
      return (
        stringValue(item, [
          "job_title",
          "position",
          "title",
          "name",
          "role",
        ]) || "Professional Experience"
      );

    case "achievements":
      return (
        stringValue(item, [
          "achievement_title",
          "title",
          "name",
          "achievement",
        ]) || "Achievement"
      );

    default:
      return "Activity";
  }
}

function getItemSubtitle(item: AnyRecord, section: string): string {
  switch (section) {
    case "courses":
      return stringValue(item, [
        "category_name",
        "category",
        "level",
        "description",
      ]);

    case "certificates":
      return stringValue(item, [
        "issuer_name",
        "issued_by",
        "organization",
        "provider",
        "description",
      ]);

    case "assessments":
      return stringValue(item, [
        "category",
        "subject",
        "level",
        "description",
      ]);

    case "doubts":
      return stringValue(item, [
        "topic",
        "category_name",
        "category",
        "description",
      ]);

    case "internships":
      return stringValue(item, [
        "company_name",
        "company",
        "organization",
        "duration",
        "description",
      ]);

    case "jobs":
      return stringValue(item, [
        "company_name",
        "company",
        "organization",
        "location",
        "description",
      ]);

    case "achievements":
      return stringValue(item, [
        "description",
        "organization",
        "issuer_name",
        "category",
      ]);

    default:
      return "";
  }
}

function getItemDate(item: AnyRecord): string {
  const value = firstValue(item, [
    "completed_at",
    "issued_at",
    "issue_date",
    "certificate_date",
    "awarded_at",
    "date",
    "created_at",
    "start_date",
    "joined_at",
  ]);

  return formatDate(value);
}

function getStatus(item: AnyRecord): string {
  return stringValue(item, [
    "status_display",
    "status_label",
    "status",
    "result",
    "state",
  ]);
}

function getScore(item: AnyRecord): string {
  const value = firstValue(item, [
    "score_percentage",
    "percentage",
    "score",
    "marks_percentage",
  ]);

  if (value === undefined || value === null || value === "") return "";

  const numeric = Number(value);

  if (Number.isFinite(numeric)) {
    return `${Number.isInteger(numeric) ? numeric : numeric.toFixed(1)}%`;
  }

  return String(value);
}

function SectionCard({
  title,
  description,
  icon: Icon,
  items,
  sectionKey,
}: {
  title: string;
  description: string;
  icon: typeof BookOpen;
  items: AnyRecord[];
  sectionKey: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const visibleItems = expanded ? items : items.slice(0, 4);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/10 backdrop-blur-xl sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
            <Icon size={21} />
          </div>

          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-white/50">
              {description}
            </p>
          </div>
        </div>

        <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/60">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-7 text-center">
          <p className="text-sm text-white/40">No public records available.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleItems.map((item, index) => (
            <PublicRecordCard
              key={`${sectionKey}-${item.id ?? item.pk ?? index}`}
              item={item}
              section={sectionKey}
            />
          ))}
        </div>
      )}

      {items.length > 4 && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/[0.07] hover:text-white"
        >
          {expanded ? (
            <>
              <ChevronUp size={17} />
              Show less
            </>
          ) : (
            <>
              <ChevronDown size={17} />
              View all {items.length}
            </>
          )}
        </button>
      )}
    </section>
  );
}

function PublicRecordCard({
  item,
  section,
}: {
  item: AnyRecord;
  section: string;
}) {
  const title = getItemTitle(item, section);
  const subtitle = getItemSubtitle(item, section);
  const date = getItemDate(item);
  const status = getStatus(item);
  const score = section === "assessments" ? getScore(item) : "";

  const tags = textArrayValue(
    firstValue(item, [
      "skills",
      "technologies",
      "tags",
      "subjects",
      "topics",
      "languages",
    ]),
  ).slice(0, 5);

  return (
    <article className="rounded-2xl border border-white/8 bg-black/15 p-4 transition hover:border-violet-400/20 hover:bg-white/[0.04]">
      <div className="flex gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-violet-300">
          {section === "courses" && <BookOpen size={17} />}
          {section === "certificates" && <Award size={17} />}
          {section === "assessments" && <ClipboardCheck size={17} />}
          {section === "doubts" && <MessageCircleQuestion size={17} />}
          {section === "internships" && <GraduationCap size={17} />}
          {section === "jobs" && <BriefcaseBusiness size={17} />}
          {section === "achievements" && <Trophy size={17} />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="font-semibold leading-6 text-white">{title}</h3>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {score && (
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                  {score}
                </span>
              )}

              {status && (
                <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-semibold capitalize text-violet-300">
                  {status.replace(/_/g, " ")}
                </span>
              )}
            </div>
          </div>

          {subtitle && (
            <p className="mt-1 text-sm leading-6 text-white/50">{subtitle}</p>
          )}

          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/8 bg-white/[0.035] px-2.5 py-1 text-xs text-white/55"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {date && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-white/35">
              <CalendarDays size={13} />
              {date}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
          <Icon size={18} />
        </div>

        <div className="min-w-0">
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="truncate text-xs font-medium text-white/45">{label}</p>
        </div>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen animate-pulse bg-[#070711] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="h-10 w-32 rounded-xl bg-white/10" />

        <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
          <div className="h-32 bg-white/[0.05] sm:h-44" />

          <div className="-mt-12 p-5 sm:-mt-16 sm:p-8">
            <div className="h-24 w-24 rounded-3xl bg-white/10 sm:h-32 sm:w-32" />
            <div className="mt-5 h-8 w-56 rounded bg-white/10" />
            <div className="mt-3 h-4 w-80 max-w-full rounded bg-white/10" />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-20 rounded-2xl bg-white/10" />
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-52 rounded-3xl bg-white/10" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PublicProfilePage() {
  const params = useParams<{ displayName: string }>();

  const displayName = useMemo(() => {
    const raw = params?.displayName;

    if (Array.isArray(raw)) return raw.join("/");

    return raw ? decodeURIComponent(raw) : "";
  }, [params]);

  const [data, setData] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const publicUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://www.knowmato.in/profile/${encodeURIComponent(displayName)}`;

  const loadProfile = useCallback(async () => {
    if (!displayName) {
      setError("This profile link is invalid.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    setLoading(true);
    setError("");

    try {
      const host = String(API_HOST || "").replace(/\/+$/, "");
      const url = `${host}/api/accounts/public/${encodeURIComponent(displayName)}/`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        credentials: "omit",
        cache: "no-store",
        signal: controller.signal,
      });

      let payload: PublicProfileResponse | null = null;

      try {
        payload = (await response.json()) as PublicProfileResponse;
      } catch {
        payload = null;
      }

      if (!response.ok || payload?.success === false) {
        throw new Error(
          payload?.message ||
            (response.status === 404
              ? "This public profile could not be found."
              : "Unable to load this public profile."),
        );
      }

      setData(normalizeResponse(payload ?? {}));
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") {
        return;
      }

      console.error("Public profile load failed:", requestError);
      setData(null);
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  }, [displayName]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!data) return;

    const name =
      stringValue(data.profile, ["full_name", "name"]) ||
      displayName ||
      "Student";

    document.title = `${name} | KnowMato Public Profile`;
  }, [data, displayName]);

  useEffect(() => {
    if (!copied) return;

    const timer = window.setTimeout(() => setCopied(false), 2200);

    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(publicUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = publicUrl;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopied(true);
    } catch (copyError) {
      console.error("Copy profile URL failed:", copyError);
    }
  };

  const handleShare = async () => {
    setSharing(true);

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${stringValue(data?.profile, ["full_name", "name"]) || displayName} | KnowMato`,
          text: "View this public KnowMato profile.",
          url: publicUrl,
        });
      } else {
        await handleCopy();
      }
    } catch (shareError: any) {
      if (shareError?.name !== "AbortError") {
        console.error("Share profile failed:", shareError);
      }
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#070711] px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[80vh] max-w-xl items-center justify-center">
          <div className="w-full rounded-3xl border border-white/10 bg-white/[0.045] p-7 text-center shadow-2xl backdrop-blur-xl sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-300">
              <UserRound size={28} />
            </div>

            <h1 className="mt-5 text-2xl font-bold">
              Public Profile Unavailable
            </h1>

            <p className="mt-2 text-sm leading-6 text-white/50">
              {error || "This profile could not be loaded."}
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void loadProfile()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
              >
                <RefreshCw size={17} />
                Try again
              </button>

              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white/75 transition hover:bg-white/[0.08] hover:text-white"
              >
                <ArrowLeft size={17} />
                Go to KnowMato
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const profile = data.profile;
  const statistics = data.statistics;

  const fullName =
    stringValue(profile, ["full_name", "name"]) || displayName || "Student";

  const photoUrl = getPhotoUrl(
    firstValue(profile, ["profile_photo", "photo", "avatar", "profile_image"]),
  );

  const bio = stringValue(profile, [
    "about_learning",
    "bio",
    "about",
    "description",
  ]);

  const education = stringValue(profile, [
    "education",
    "education_level",
    "qualification",
  ]);

  const gradeYear = stringValue(profile, [
    "grade_year",
    "year",
    "academic_year",
  ]);

  const stream = stringValue(profile, [
    "stream",
    "stream_name",
    "specialization",
  ]);

  const skillLevel = stringValue(profile, [
    "skill_level",
    "level",
    "experience_level",
  ]);

  const languages = textArrayValue(
    firstValue(profile, ["preferred_languages", "languages"]),
  );

  const subjects = textArrayValue(
    firstValue(profile, ["subjects", "interests", "areas_of_interest"]),
  );

  const learningGoals = textArrayValue(
    firstValue(profile, ["learning_goals", "goals"]),
  );

  const stats = [
    {
      label: "Courses",
      value: numberValue(
        statistics,
        ["courses", "courses_count", "course_count"],
        data.courses.length,
      ),
      icon: BookOpen,
    },
    {
      label: "Certificates",
      value: numberValue(
        statistics,
        ["certificates", "certificates_count", "certificate_count"],
        data.certificates.length,
      ),
      icon: Award,
    },
    {
      label: "Assessments",
      value: numberValue(
        statistics,
        ["assessments", "assessments_count", "assessment_count"],
        data.assessments.length,
      ),
      icon: ClipboardCheck,
    },
    {
      label: "Achievements",
      value: numberValue(
        statistics,
        ["achievements", "achievements_count", "achievement_count"],
        data.achievements.length,
      ),
      icon: Trophy,
    },
  ];

  const publicSections = SECTION_META.filter(
    (section) => data[section.key].length > 0,
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#070711] text-white">
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-20rem] h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute right-[-15rem] top-[30rem] h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/5 blur-3xl" />
      </div>

      <nav className="sticky top-0 z-40 border-b border-white/8 bg-[#070711]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a
            href="/"
            className="flex items-center gap-2.5 text-sm font-bold text-white"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 shadow-lg shadow-violet-900/20">
              K
            </span>
            <span>KnowMato</span>
          </a>

          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/[0.08] hover:text-white"
            >
              {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              {copied ? "Copied" : "Copy link"}
            </button>

            <button
              type="button"
              onClick={() => void handleShare()}
              disabled={sharing}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sharing ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Share2 size={16} />
              )}
              Share
            </button>
          </div>

          <button
            type="button"
            aria-label="Open profile actions"
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-white/70 sm:hidden"
          >
            {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-white/8 px-4 py-3 sm:hidden">
            <div className="mx-auto flex max-w-6xl gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  void handleCopy();
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-white/70"
              >
                {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                {copied ? "Copied" : "Copy link"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  void handleShare();
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-3 py-2.5 text-sm font-semibold text-white"
              >
                <Share2 size={16} />
                Share
              </button>
            </div>
          </div>
        )}
      </nav>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-white/45 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            KnowMato
          </a>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/10 bg-emerald-400/5 px-3 py-1.5 text-xs font-semibold text-emerald-300/80">
            <CheckCircle2 size={13} />
            Public profile
          </span>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="relative h-32 overflow-hidden bg-gradient-to-r from-violet-950 via-fuchsia-950/70 to-slate-950 sm:h-44">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(167,139,250,0.25),transparent_35%),radial-gradient(circle_at_80%_40%,rgba(236,72,153,0.18),transparent_35%)]" />
          </div>

          <div className="relative px-5 pb-6 sm:px-8 sm:pb-8">
            <div className="-mt-12 flex flex-col gap-5 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex min-w-0 flex-col items-start gap-4 sm:flex-row sm:items-end">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={`${fullName} profile`}
                    className="h-24 w-24 shrink-0 rounded-3xl border-4 border-[#11111c] bg-[#11111c] object-cover shadow-xl sm:h-32 sm:w-32"
                  />
                ) : (
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border-4 border-[#11111c] bg-gradient-to-br from-violet-600 to-fuchsia-600 text-3xl font-bold text-white shadow-xl sm:h-32 sm:w-32 sm:text-4xl">
                    {getInitials(fullName)}
                  </div>
                )}

                <div className="min-w-0 pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="break-words text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                      {fullName}
                    </h1>

                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-300">
                      <Sparkles size={12} />
                      KnowMato
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-white/45">
                    @{displayName}
                  </p>

                  {(education || gradeYear || stream || skillLevel) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[education, gradeYear, stream, skillLevel]
                        .filter(Boolean)
                        .map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-white/8 bg-white/[0.035] px-3 py-1 text-xs font-medium text-white/55"
                          >
                            {item}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="hidden shrink-0 sm:block">
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs font-semibold text-white/55 transition hover:bg-white/[0.08] hover:text-white"
                >
                  <ExternalLink size={14} />
                  Open profile link
                </a>
              </div>
            </div>

            {bio && (
              <div className="mt-6 max-w-4xl">
                <p className="text-sm leading-7 text-white/60 sm:text-[15px]">
                  {bio}
                </p>
              </div>
            )}

            {(languages.length > 0 ||
              subjects.length > 0 ||
              learningGoals.length > 0) && (
              <div className="mt-6 grid gap-5 border-t border-white/8 pt-6 lg:grid-cols-3">
                {[
                  ["Languages", languages],
                  ["Subjects", subjects],
                  ["Learning goals", learningGoals],
                ].map(([label, values]) => {
                  const list = values as string[];

                  if (!list.length) return null;

                  return (
                    <div key={label as string}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/35">
                        {label as string}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {list.map((item) => (
                          <span
                            key={item}
                            className="rounded-full bg-white/[0.05] px-2.5 py-1 text-xs text-white/60"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
            />
          ))}
        </section>

        {publicSections.length > 0 ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {publicSections.map((section) => (
              <SectionCard
                key={section.key}
                title={section.title}
                description={section.description}
                icon={section.icon}
                items={data[section.key]}
                sectionKey={section.key}
              />
            ))}
          </div>
        ) : (
          <section className="mt-6 rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-10 text-center">
            <Link2 className="mx-auto text-white/25" size={28} />
            <h2 className="mt-4 text-lg font-semibold text-white">
              Profile is ready
            </h2>
            <p className="mt-1 text-sm text-white/40">
              Public learning and achievement records will appear here when available.
            </p>
          </section>
        )}

        <footer className="py-10 text-center">
          <p className="text-xs text-white/25">
            This is a public KnowMato profile. Only information made public by
            KnowMato&apos;s public profile service is displayed.
          </p>
        </footer>
      </div>
    </main>
  );
}
