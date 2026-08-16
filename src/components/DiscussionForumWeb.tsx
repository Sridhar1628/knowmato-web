"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  createDiscussion,
  createDiscussionReply,
  getCourseDiscussions,
  getDiscussionReplies,
  voteDiscussion,
  voteDiscussionReply,
  type DiscussionReply,
  type DiscussionThread,
} from "@/services/courseService";
import toast from "react-hot-toast";

interface DiscussionForumWebProps {
  courseId: number;
}

/* =========================================================
   API RESPONSE NORMALIZATION
   Supports plain arrays and wrapped API responses.
========================================================= */

function extractList<T = any>(response: any): T[] {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== "object") return [];

  const candidates = [
    response.results,
    response.data,
    response.discussions,
    response.items,
    response.data?.results,
    response.data?.discussions,
    response.data?.items,
    response.data?.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
}

function extractObject<T = any>(response: any): T | null {
  if (!response || typeof response !== "object") return null;
  if (response.data && typeof response.data === "object" && !Array.isArray(response.data)) {
    if (response.data.data && typeof response.data.data === "object" && !Array.isArray(response.data.data)) {
      return response.data.data as T;
    }
    return response.data as T;
  }
  return response as T;
}

function safeNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatDate(value: unknown): string {
  if (!value) return "Recently";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/* =========================================================
   USER DISPLAY HELPERS
========================================================= */

function getUserDisplayName(user: any): string {
  if (!user) return "Student";

  /*
   * Prefer display_name.
   * Email is intentionally never used as the visible name.
   */
  const displayName =
    user.display_name ||
    user.displayName ||
    user.full_name ||
    user.fullName ||
    user.name;

  if (
    typeof displayName === "string" &&
    displayName.trim()
  ) {
    return displayName.trim();
  }

  /*
   * Username is only a fallback when display_name
   * is not available.
   */
  if (
    typeof user.username === "string" &&
    user.username.trim()
  ) {
    return user.username.trim();
  }

  return "Student";
}

function getUserInitial(user: any): string {
  const name = getUserDisplayName(user);
  return name.charAt(0).toUpperCase() || "S";
}

/*
 * Tutor detection.
 *
 * Preferred backend field:
 *   is_course_tutor: true
 *
 * The fallbacks support existing API responses
 * that expose role/user_type/instructor information.
 */
function isCourseTutor(
  user: any,
  item?: any,
): boolean {
  if (!user && !item) return false;

  if (
    item?.is_course_tutor === true ||
    item?.is_course_instructor === true
  ) {
    return true;
  }

  if (
    user?.is_course_tutor === true ||
    user?.is_course_instructor === true ||
    user?.is_instructor === true ||
    user?.is_tutor === true ||
    user?.is_teacher === true
  ) {
    return true;
  }

  const role = String(
    user?.role ||
      user?.user_role ||
      user?.user_type ||
      user?.account_type ||
      "",
  ).toLowerCase();

  if (
    role === "instructor" ||
    role === "tutor" ||
    role === "teacher" ||
    role === "course_tutor" ||
    role === "course-instructor"
  ) {
    return true;
  }

  const userId =
    user?.id ?? user?.user_id;

  const instructorId =
    item?.course_instructor_id ??
    item?.instructor_id ??
    item?.course?.instructor_id ??
    item?.course?.instructor?.id ??
    item?.thread?.course_instructor_id ??
    item?.thread?.instructor_id;

  return (
    userId != null &&
    instructorId != null &&
    Number(userId) === Number(instructorId)
  );
}

function UserRoleBadge({
  isTutor,
}: {
  isTutor: boolean;
}) {
  return isTutor ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-300">
      🎓 Course Tutor
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/45">
      Student
    </span>
  );
}

export default function DiscussionForumWeb({
  courseId,
}: DiscussionForumWebProps) {
  const [discussions, setDiscussions] = useState<DiscussionThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [expandedThread, setExpandedThread] = useState<number | null>(null);
  const [replies, setReplies] = useState<Record<number, DiscussionReply[]>>(
    {},
  );
  const [replyLoading, setReplyLoading] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [replyText, setReplyText] = useState("");

  const loadDiscussions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCourseDiscussions(courseId);
      console.log("[DiscussionForum] discussions response:", response);
      setDiscussions(extractList<DiscussionThread>(response));
    } catch (error) {
      console.error("Failed to load discussions:", error);
      toast.error("Unable to load discussions.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadDiscussions();
  }, [loadDiscussions]);

  const loadReplies = async (threadId: number) => {
    try {
      const response = await getDiscussionReplies(threadId);
      console.log(`[DiscussionForum] replies response for ${threadId}:`, response);
      setReplies((prev) => ({
        ...prev,
        [threadId]: extractList<DiscussionReply>(response),
      }));
    } catch (error) {
      console.error("Failed to load replies:", error);
      toast.error("Unable to load replies.");
    }
  };

  const toggleReplies = async (threadId: number) => {
    if (expandedThread === threadId) {
      setExpandedThread(null);
      return;
    }

    setExpandedThread(threadId);

    if (!replies[threadId]) {
      await loadReplies(threadId);
    }
  };

  const handleCreateDiscussion = async (event: FormEvent) => {
    event.preventDefault();

    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    if (!cleanTitle || !cleanContent) {
      toast.error("Title and question are required.");
      return;
    }

    try {
      setCreating(true);

      const response = await createDiscussion(courseId, {
        title: cleanTitle,
        content: cleanContent,
      });

      console.log("[DiscussionForum] create response:", response);
      const created = extractObject<DiscussionThread>(response);

      if (created?.id) {
        setDiscussions((prev) => [created, ...prev]);
      } else {
        await loadDiscussions();
      }
      setTitle("");
      setContent("");

      toast.success("Discussion posted.");
    } catch (error: any) {
      console.error("Failed to create discussion:", error);
      toast.error(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Unable to create discussion.",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleReply = async (threadId: number) => {
    const cleanReply = replyText.trim();

    if (!cleanReply) {
      toast.error("Reply cannot be empty.");
      return;
    }

    try {
      setReplyLoading(threadId);

      const response = await createDiscussionReply(threadId, {
        content: cleanReply,
      });

      console.log(`[DiscussionForum] reply response for ${threadId}:`, response);
      const created = extractObject<DiscussionReply>(response);

      if (created?.id) {
        setReplies((prev) => ({
          ...prev,
          [threadId]: [...(prev[threadId] || []), created],
        }));

        setDiscussions((prev) =>
          prev.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  reply_count: safeNumber(thread.reply_count) + 1,
                  latest_reply: created,
                }
              : thread,
          ),
        );
      } else {
        await loadReplies(threadId);
      }

      setReplyText("");
      setReplyingTo(null);
      setExpandedThread(threadId);

      toast.success("Reply posted.");
    } catch (error: any) {
      console.error("Failed to reply:", error);
      toast.error(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Unable to post reply.",
      );
    } finally {
      setReplyLoading(null);
    }
  };

  const handleVoteThread = async (
    threadId: number,
    voteType: "up" | "down",
  ) => {
    try {
      const result = extractObject<any>(await voteDiscussion(threadId, voteType)) || {};

      setDiscussions((prev) =>
        prev.map((thread) =>
          thread.id === threadId
            ? {
                ...thread,
                vote_count: result.vote_count,
                user_vote: result.vote,
              }
            : thread,
        ),
      );
    } catch (error) {
      console.error("Failed to vote:", error);
      toast.error("Unable to update vote.");
    }
  };

  const handleVoteReply = async (
    threadId: number,
    replyId: number,
    voteType: "up" | "down",
  ) => {
    try {
      const result = extractObject<any>(await voteDiscussionReply(replyId, voteType)) || {};

      setReplies((prev) => ({
        ...prev,
        [threadId]: (prev[threadId] || []).map((reply) =>
          reply.id === replyId
            ? {
                ...reply,
                vote_count: result.vote_count,
                user_vote: result.vote,
              }
            : reply,
        ),
      }));
    } catch (error) {
      console.error("Failed to vote reply:", error);
      toast.error("Unable to update vote.");
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-2xl backdrop-blur-xl sm:p-6">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            Discussion Forum
          </h2>
          <p className="mt-1 text-sm text-white/50">
            Ask questions, share answers, and learn together.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
            {discussions.length} discussion{discussions.length === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            onClick={loadDiscussions}
            disabled={loading}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/60 hover:bg-white/10 disabled:opacity-40"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <form
        onSubmit={handleCreateDiscussion}
        className="mt-5 rounded-xl border border-violet-500/15 bg-violet-500/[0.06] p-4"
      >
        <h3 className="font-semibold text-white">Start a discussion</h3>

        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={200}
          placeholder="What would you like to ask?"
          className="mt-3 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-violet-400/60"
        />

        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={3}
          maxLength={5000}
          placeholder="Describe your question or share something with the class..."
          className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-violet-400/60"
        />

        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? "Posting..." : "+ Ask Question"}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="space-y-4 py-6">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-xl border border-white/10 bg-white/5 p-5"
            >
              <div className="h-5 w-2/3 rounded bg-white/10" />
              <div className="mt-3 h-4 w-full rounded bg-white/10" />
              <div className="mt-2 h-4 w-4/5 rounded bg-white/10" />
            </div>
          ))}
        </div>
      ) : discussions.length === 0 ? (
        <div className="py-12 text-center">
          <div className="text-4xl">💬</div>
          <p className="mt-3 font-semibold text-white">No discussions yet</p>
          <p className="mt-1 text-sm text-white/40">
            Be the first student to ask a question.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {discussions.map((thread) => {
            const threadReplies = replies[thread.id] || [];
            const isExpanded = expandedThread === thread.id;

            return (
              <article
                key={thread.id}
                className="rounded-xl border border-white/10 bg-white/[0.025] p-4 transition hover:border-violet-400/20 sm:p-5"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-white/40">
                  {thread.is_pinned && (
                    <span className="rounded-full bg-amber-500/10 px-2 py-1 text-amber-300">
                      📌 Pinned
                    </span>
                  )}

                  {thread.is_closed && (
                    <span className="rounded-full bg-red-500/10 px-2 py-1 text-red-300">
                      Closed
                    </span>
                  )}

                  {thread.latest_reply?.is_answer && (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-300">
                      ✓ Answered
                    </span>
                  )}
                </div>

                <h3 className="mt-3 text-lg font-bold text-white">
                  {thread.title}
                </h3>

                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-white/65">
                  {thread.content}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/40">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 text-xs font-bold text-violet-200">
                      {getUserInitial(thread.user)}
                    </div>

                    <span className="font-semibold text-white/80">
                      {getUserDisplayName(thread.user)}
                    </span>

                    <UserRoleBadge
                      isTutor={isCourseTutor(
                        thread.user,
                        thread,
                      )}
                    />
                  </div>

                  <span>•</span>

                  <span>
                    {formatDate(thread.created_at)}
                  </span>

                  <span>•</span>

                  <span>{safeNumber(thread.views)} views</span>

                  <span>•</span>

                  <span>{safeNumber(thread.reply_count)} replies</span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleVoteThread(thread.id, "up")}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      thread.user_vote === "up"
                        ? "bg-violet-500/20 text-violet-300"
                        : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    👍 {safeNumber(thread.vote_count)}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleVoteThread(thread.id, "down")}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      thread.user_vote === "down"
                        ? "bg-red-500/20 text-red-300"
                        : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    👎
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleReplies(thread.id)}
                    className="rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
                  >
                    {isExpanded ? "Hide Replies" : "View Replies"}
                  </button>

                  {!thread.is_closed && (
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingTo(
                          replyingTo === thread.id ? null : thread.id,
                        );
                        setExpandedThread(thread.id);
                        if (!replies[thread.id]) {
                          loadReplies(thread.id);
                        }
                      }}
                      className="rounded-lg bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-300 transition hover:bg-violet-500/20"
                    >
                      Reply
                    </button>
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-5 border-t border-white/10 pt-4">
                    {replyingTo === thread.id && !thread.is_closed && (
                      <div className="mb-4">
                        <textarea
                          value={replyText}
                          onChange={(event) => setReplyText(event.target.value)}
                          rows={3}
                          maxLength={5000}
                          placeholder="Write your reply..."
                          className="w-full resize-none rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-violet-400/60"
                        />

                        <div className="mt-2 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyText("");
                            }}
                            className="rounded-lg bg-white/5 px-4 py-2 text-xs text-white/60 hover:bg-white/10"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            disabled={replyLoading === thread.id}
                            onClick={() => handleReply(thread.id)}
                            className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-50"
                          >
                            {replyLoading === thread.id
                              ? "Posting..."
                              : "Post Reply"}
                          </button>
                        </div>
                      </div>
                    )}

                    {threadReplies.length === 0 ? (
                      <p className="py-4 text-center text-sm text-white/35">
                        No replies yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {threadReplies.map((reply) => (
                          <div
                            key={reply.id}
                            className="rounded-lg border border-white/10 bg-black/10 p-4"
                          >
                            <div className="flex flex-wrap items-center gap-2 text-xs text-white/40">
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-xs font-bold text-violet-200">
                                  {getUserInitial(reply.user)}
                                </div>

                                <span className="font-semibold text-white/80">
                                  {getUserDisplayName(reply.user)}
                                </span>

                                <UserRoleBadge
                                  isTutor={isCourseTutor(
                                    reply.user,
                                    {
                                      ...reply,
                                      thread,
                                    },
                                  )}
                                />
                              </div>

                              {reply.is_answer && (
                                <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-300">
                                  ✓ Answer
                                </span>
                              )}

                              <span>
                                {formatDate(reply.created_at)}
                              </span>
                            </div>

                            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-white/65">
                              {reply.content}
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                handleVoteReply(thread.id, reply.id, "up")
                              }
                              className={`mt-3 rounded-lg px-3 py-1.5 text-xs ${
                                reply.user_vote === "up"
                                  ? "bg-violet-500/20 text-violet-300"
                                  : "bg-white/5 text-white/50 hover:bg-white/10"
                              }`}
                            >
                              👍 {safeNumber(reply.vote_count)}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}