"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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


// ============================================================
// PROPS
// ============================================================

interface DiscussionForumWebProps {
  courseId: number;
}


// ============================================================
// WEBSOCKET CONFIGURATION
// ============================================================
//
// Production:
//   wss://api.knowmato.in
//
// Local:
//   ws://127.0.0.1:8000
//
// You can override this with:
//
// NEXT_PUBLIC_WS_BASE_URL=wss://api.knowmato.in
//
// IMPORTANT:
// The paths below must match your Django Channels routing.
// Based on the backend group names you already have:
//
//   discussion_course_<course_id>
//   discussion_thread_<thread_id>
//
// ============================================================

const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_BASE_URL ||
  (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://127.0.0.1:8000"
  )
    .replace(/^http:\/\//, "ws://")
    .replace(/^https:\/\//, "wss://")
    .replace(/\/+$/, "");


const COURSE_WS_PATH =
  (courseId: number) =>
    `/ws/discussion/course/${courseId}/`;


const THREAD_WS_PATH =
  (threadId: number) =>
    `/ws/discussion/thread/${threadId}/`;


// ============================================================
// TYPES
// ============================================================

type SocketEvent = {
  type?: string;
  data?: any;
  timestamp?: string;
  [key: string]: any;
};


type SocketState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";


// ============================================================
// API RESPONSE NORMALIZATION
// ============================================================

function extractList<T = any>(
  response: any,
): T[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (
    !response ||
    typeof response !== "object"
  ) {
    return [];
  }

  const candidates = [
    response.results,
    response.data,
    response.discussions,
    response.threads,
    response.replies,
    response.items,

    response.data?.results,
    response.data?.discussions,
    response.data?.threads,
    response.data?.replies,
    response.data?.items,
    response.data?.data,
  ];

  for (
    const candidate of candidates
  ) {
    if (
      Array.isArray(candidate)
    ) {
      return candidate;
    }
  }

  return [];
}


function extractObject<T = any>(
  response: any,
): T | null {
  if (
    !response ||
    typeof response !== "object"
  ) {
    return null;
  }

  if (
    response.data &&
    typeof response.data === "object" &&
    !Array.isArray(response.data)
  ) {
    if (
      response.data.data &&
      typeof response.data.data === "object" &&
      !Array.isArray(response.data.data)
    ) {
      return response.data.data as T;
    }

    return response.data as T;
  }

  return response as T;
}


// ============================================================
// SAFE HELPERS
// ============================================================

function safeNumber(
  value: unknown,
  fallback = 0,
): number {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}


function safeString(
  value: unknown,
  fallback = "",
): string {
  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  const result =
    String(value).trim();

  return result || fallback;
}


function safeBoolean(
  value: unknown,
  fallback = false,
): boolean {
  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  if (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true" ||
    value === "True"
  ) {
    return true;
  }

  if (
    value === false ||
    value === 0 ||
    value === "0" ||
    value === "false" ||
    value === "False"
  ) {
    return false;
  }

  return fallback;
}


function normalizeVote(
  value: unknown,
): "up" | "down" | null {
  if (
    value === "up" ||
    value === "down"
  ) {
    return value;
  }

  return null;
}


// ============================================================
// DATE
// ============================================================

function formatDate(
  value: unknown,
): string {
  if (!value) {
    return "Recently";
  }

  const date =
    new Date(
      String(value),
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Recently";
  }

  return date.toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );
}


// ============================================================
// USER DISPLAY
// ============================================================

function getUserDisplayName(
  user: any,
): string {
  if (!user) {
    return "Student";
  }

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

  if (
    typeof user.username === "string" &&
    user.username.trim()
  ) {
    return user.username.trim();
  }

  return "Student";
}


function getUserInitial(
  user: any,
): string {
  const name =
    getUserDisplayName(user);

  return (
    name
      .charAt(0)
      .toUpperCase() || "S"
  );
}


// ============================================================
// TUTOR DETECTION
// ============================================================

function isCourseTutor(
  user: any,
  item?: any,
): boolean {
  if (!user && !item) {
    return false;
  }

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

  const role =
    String(
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
    user?.id ??
    user?.user_id;

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
    Number(userId) ===
      Number(instructorId)
  );
}


// ============================================================
// ROLE BADGE
// ============================================================

function UserRoleBadge({
  isTutor,
}: {
  isTutor: boolean;
}) {
  if (isTutor) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-300">
        🎓 Course Tutor
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/45">
      Student
    </span>
  );
}


// ============================================================
// NORMALIZE THREAD
// ============================================================

function normalizeThread(
  input: any,
): DiscussionThread {
  const raw =
    input &&
    typeof input === "object"
      ? input
      : {};

  const user =
    raw.user ||
    raw.author ||
    raw.created_by ||
    {
      id:
        raw.user_id ??
        raw.userId,
      username:
        raw.username ||
        "Student",
    };

  return {
    ...raw,

    id:
      safeNumber(
        raw.id ??
          raw.thread_id ??
          raw.threadId,
      ),

    title:
      safeString(
        raw.title,
        "Untitled discussion",
      ),

    content:
      safeString(
        raw.content,
        "",
      ),

    created_at:
      raw.created_at ??
      raw.createdAt ??
      raw.timestamp ??
      new Date().toISOString(),

    views:
      safeNumber(
        raw.views ??
          raw.view_count ??
          raw.viewCount,
      ),

    reply_count:
      safeNumber(
        raw.reply_count ??
          raw.replyCount,
      ),

    unread_replies_count:
      safeNumber(
        raw.unread_replies_count ??
          raw.unreadRepliesCount,
      ),

    is_pinned:
      safeBoolean(
        raw.is_pinned ??
          raw.isPinned,
      ),

    is_closed:
      safeBoolean(
        raw.is_closed ??
          raw.isClosed,
      ),

    vote_count:
      safeNumber(
        raw.vote_count ??
          raw.voteCount ??
          raw.score,
      ),

    user_vote:
      normalizeVote(
        raw.user_vote ??
          raw.userVote,
      ),

    can_edit:
      safeBoolean(
        raw.can_edit ??
          raw.canEdit,
      ),

    can_delete:
      safeBoolean(
        raw.can_delete ??
          raw.canDelete,
      ),

    can_pin:
      safeBoolean(
        raw.can_pin ??
          raw.canPin,
      ),

    can_close:
      safeBoolean(
        raw.can_close ??
          raw.canClose,
      ),

    latest_reply:
      raw.latest_reply ??
      raw.latestReply ??
      null,

    user,
  } as DiscussionThread;
}


// ============================================================
// NORMALIZE REPLY
// ============================================================

function normalizeReply(
  input: any,
): DiscussionReply {
  const raw =
    input &&
    typeof input === "object"
      ? input
      : {};

  const user =
    raw.user ||
    raw.author ||
    {
      id:
        raw.user_id ??
        raw.userId,
      username:
        raw.username ||
        "Student",
    };

  return {
    ...raw,

    id:
      safeNumber(
        raw.id ??
          raw.reply_id ??
          raw.replyId,
      ),

    user,

    content:
      safeString(
        raw.content,
        "",
      ),

    created_at:
      raw.created_at ??
      raw.createdAt ??
      raw.timestamp ??
      new Date().toISOString(),

    updated_at:
      raw.updated_at ??
      raw.updatedAt ??
      raw.created_at ??
      new Date().toISOString(),

    is_answer:
      safeBoolean(
        raw.is_answer ??
          raw.isAnswer,
      ),

    parent_reply:
      raw.parent_reply ??
      raw.parentReply ??
      null,

    can_edit:
      safeBoolean(
        raw.can_edit ??
          raw.canEdit,
      ),

    can_delete:
      safeBoolean(
        raw.can_delete ??
          raw.canDelete,
      ),

    can_mark_as_answer:
      safeBoolean(
        raw.can_mark_as_answer ??
          raw.canMarkAsAnswer,
      ),

    vote_count:
      safeNumber(
        raw.vote_count ??
          raw.voteCount ??
          raw.score,
      ),

    user_vote:
      normalizeVote(
        raw.user_vote ??
          raw.userVote,
      ),
  } as DiscussionReply;
}


// ============================================================
// AUTH TOKEN
// ============================================================
//
// The backend already exposes a JWT WebSocket-token endpoint,
// but your current web app already has authenticated API calls.
// We first look for a locally stored access token.
//
// If your project uses a different key, add it here.
// ============================================================

function getAccessToken(): string | null {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  const keys = [
    "accessToken",
    "access_token",
    "access",
    "token",
    "jwt",
  ];

  for (
    const key of keys
  ) {
    try {
      const value =
        window.localStorage.getItem(
          key,
        );

      if (value) {
        return value;
      }
    } catch {
      // Ignore localStorage failures.
    }
  }

  return null;
}


// ============================================================
// SOCKET URL
// ============================================================

function createSocketUrl(
  path: string,
): string {
  const token =
    getAccessToken();

  const separator =
    path.includes("?")
      ? "&"
      : "?";

  if (!token) {
    return `${WS_BASE_URL}${path}`;
  }

  return `${WS_BASE_URL}${path}${separator}token=${encodeURIComponent(
    token,
  )}`;
}


// ============================================================
// SOCKET EVENT PARSER
// ============================================================

function parseSocketMessage(
  event: MessageEvent,
): SocketEvent | null {
  try {
    const parsed =
      typeof event.data ===
      "string"
        ? JSON.parse(
            event.data,
          )
        : event.data;

    if (
      !parsed ||
      typeof parsed !== "object"
    ) {
      return null;
    }

    return parsed as SocketEvent;
  } catch (error) {
    console.error(
      "[DiscussionForum] Invalid WebSocket message:",
      error,
    );

    return null;
  }
}


// ============================================================
// COMPONENT
// ============================================================

export default function DiscussionForumWeb({
  courseId,
}: DiscussionForumWebProps) {

  // ==========================================================
  // STATE
  // ==========================================================

  const [
    discussions,
    setDiscussions,
  ] =
    useState<DiscussionThread[]>(
      [],
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    creating,
    setCreating,
  ] =
    useState(false);

  const [
    replyingTo,
    setReplyingTo,
  ] =
    useState<number | null>(
      null,
    );

  const [
    expandedThread,
    setExpandedThread,
  ] =
    useState<number | null>(
      null,
    );

  const [
    replies,
    setReplies,
  ] =
    useState<
      Record<
        number,
        DiscussionReply[]
      >
    >({});

  const [
    replyLoading,
    setReplyLoading,
  ] =
    useState<number | null>(
      null,
    );

  const [
    title,
    setTitle,
  ] =
    useState("");

  const [
    content,
    setContent,
  ] =
    useState("");

  const [
    replyText,
    setReplyText,
  ] =
    useState("");

  const [
    courseSocketState,
    setCourseSocketState,
  ] =
    useState<SocketState>(
      "disconnected",
    );

  const [
    threadSocketState,
    setThreadSocketState,
  ] =
    useState<SocketState>(
      "disconnected",
    );


  // ==========================================================
  // REFS
  // ==========================================================

  const courseSocketRef =
    useRef<WebSocket | null>(
      null,
    );

  const threadSocketRef =
    useRef<WebSocket | null>(
      null,
    );

  const reconnectCourseTimerRef =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  const reconnectThreadTimerRef =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  const mountedRef =
    useRef(false);

  const expandedThreadRef =
    useRef<number | null>(
      null,
    );

  const courseSocketGenerationRef =
    useRef(0);

  const threadSocketGenerationRef =
    useRef(0);


  // ==========================================================
  // KEEP EXPANDED THREAD REF SYNCHRONIZED
  // ==========================================================

  useEffect(() => {
    expandedThreadRef.current =
      expandedThread;
  }, [
    expandedThread,
  ]);


  // ==========================================================
  // MOUNT
  // ==========================================================

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);


  // ==========================================================
  // UPSERT DISCUSSION
  //
  // Critical:
  // REST create + WebSocket create must NOT create duplicates.
  // ==========================================================

  const upsertDiscussion =
    useCallback(
      (
        incoming: any,
      ) => {
        const thread =
          normalizeThread(
            incoming,
          );

        if (!thread.id) {
          return;
        }

        setDiscussions(
          (previous) => {
            const existingIndex =
              previous.findIndex(
                (item) =>
                  item.id ===
                  thread.id,
              );

            if (
              existingIndex ===
              -1
            ) {
              return [
                thread,
                ...previous,
              ];
            }

            const next =
              [...previous];

            next[
              existingIndex
            ] = {
              ...next[
                existingIndex
              ],
              ...thread,
            };

            return next;
          },
        );
      },
      [],
    );


  // ==========================================================
  // UPDATE DISCUSSION PARTIALLY
  // ==========================================================

  const updateDiscussion =
    useCallback(
      (
        threadId: number,
        patch: Partial<DiscussionThread>,
      ) => {
        if (!threadId) {
          return;
        }

        setDiscussions(
          (previous) =>
            previous.map(
              (thread) =>
                thread.id ===
                threadId
                  ? {
                      ...thread,
                      ...patch,
                    }
                  : thread,
            ),
        );
      },
      [],
    );


  // ==========================================================
  // UPSERT REPLY
  // ==========================================================

  const upsertReply =
    useCallback(
      (
        threadId: number,
        incoming: any,
      ) => {
        const reply =
          normalizeReply(
            incoming,
          );

        if (
          !threadId ||
          !reply.id
        ) {
          return;
        }

        setReplies(
          (previous) => {
            const existing =
              previous[
                threadId
              ] || [];

            const index =
              existing.findIndex(
                (item) =>
                  item.id ===
                  reply.id,
              );

            if (
              index ===
              -1
            ) {
              return {
                ...previous,
                [threadId]: [
                  ...existing,
                  reply,
                ],
              };
            }

            const next =
              [...existing];

            next[index] = {
              ...next[index],
              ...reply,
            };

            return {
              ...previous,
              [threadId]:
                next,
            };
          },
        );
      },
      [],
    );


  // ==========================================================
  // REMOVE REPLY
  // ==========================================================

  const removeReply =
    useCallback(
      (
        threadId: number,
        replyId: number,
      ) => {
        setReplies(
          (previous) => ({
            ...previous,
            [threadId]: (
              previous[
                threadId
              ] || []
            ).filter(
              (reply) =>
                reply.id !==
                replyId,
            ),
          }),
        );
      },
      [],
    );


  // ==========================================================
  // LOAD DISCUSSIONS
  //
  // REST is only used for initial state / manual refresh.
  // WebSocket events do NOT call this function.
  //
  // This is important to prevent:
  //
  // websocket -> API -> render -> websocket -> API ...
  //
  // ==========================================================

  const loadDiscussions =
    useCallback(
      async (
        showLoader = true,
      ) => {
        try {
          if (
            showLoader
          ) {
            setLoading(true);
          }

          const response =
            await getCourseDiscussions(
              courseId,
            );

          console.log(
            "[DiscussionForum] discussions response:",
            response,
          );

          const list =
            extractList<DiscussionThread>(
              response,
            );

          setDiscussions(
            list.map(
              normalizeThread,
            ),
          );

        } catch (error) {
          console.error(
            "[DiscussionForum] Failed to load discussions:",
            error,
          );

          toast.error(
            "Unable to load discussions.",
          );
        } finally {
          if (
            mountedRef.current
          ) {
            setLoading(false);
          }
        }
      },
      [
        courseId,
      ],
    );


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadDiscussions(true);
  }, [
    loadDiscussions,
  ]);


  // ==========================================================
  // LOAD REPLIES
  // ==========================================================

  const loadReplies =
    useCallback(
      async (
        threadId: number,
      ) => {
        try {
          const response =
            await getDiscussionReplies(
              threadId,
            );

          console.log(
            `[DiscussionForum] replies response for ${threadId}:`,
            response,
          );

          const list =
            extractList<DiscussionReply>(
              response,
            );

          setReplies(
            (previous) => ({
              ...previous,
              [threadId]:
                list.map(
                  normalizeReply,
                ),
            }),
          );
        } catch (error) {
          console.error(
            "[DiscussionForum] Failed to load replies:",
            error,
          );

          toast.error(
            "Unable to load replies.",
          );
        }
      },
      [],
    );


  // ==========================================================
  // COURSE SOCKET EVENT HANDLER
  // ==========================================================

  const handleCourseSocketMessage =
    useCallback(
      (
        event: SocketEvent,
      ) => {
        const type =
          safeString(
            event.type,
          ).toLowerCase();

        const data =
          event.data ??
          event;

        console.log(
          "📩 [DiscussionForum] COURSE WS:",
          type,
          data,
        );


        // ------------------------------------------------------
        // NEW DISCUSSION
        // ------------------------------------------------------

        if (
          type ===
          "discussion_thread_created"
        ) {
          upsertDiscussion(
            data,
          );

          return;
        }


        // ------------------------------------------------------
        // THREAD UPDATED
        // ------------------------------------------------------

        if (
          type ===
          "discussion_thread_updated"
        ) {
          const thread =
            normalizeThread(
              data,
            );

          if (
            thread.id
          ) {
            upsertDiscussion(
              thread,
            );
          }

          return;
        }


        // ------------------------------------------------------
        // THREAD DELETED
        // ------------------------------------------------------

        if (
          type ===
            "discussion_thread_deleted" ||
          type ===
            "thread_deleted"
        ) {
          const threadId =
            safeNumber(
              data?.thread_id ??
                data?.threadId ??
                data?.id,
            );

          if (
            threadId
          ) {
            setDiscussions(
              (previous) =>
                previous.filter(
                  (thread) =>
                    thread.id !==
                    threadId,
                ),
            );

            setReplies(
              (previous) => {
                const next =
                  {
                    ...previous,
                  };

                delete next[
                  threadId
                ];

                return next;
              },
            );

            if (
              expandedThreadRef.current ===
              threadId
            ) {
              setExpandedThread(
                null,
              );

              expandedThreadRef.current =
                null;
            }
          }

          return;
        }


        // ------------------------------------------------------
        // COURSE REPLY NOTIFICATION
        //
        // The backend intentionally sends only notification
        // data here, not the full reply.
        //
        // We therefore update the thread count, but don't add
        // a fake/incomplete reply to the visible reply list.
        // ------------------------------------------------------

        if (
          type ===
          "discussion_reply_notification"
        ) {
          const threadId =
            safeNumber(
              data?.thread_id ??
                data?.threadId,
            );

          if (
            threadId
          ) {
            updateDiscussion(
              threadId,
              {
                reply_count:
                  safeNumber(
                    discussions.find(
                      (thread) =>
                        thread.id ===
                        threadId,
                    )?.reply_count,
                  ) + 1,
              },
            );

            /*
             * If this thread isn't open, the notification
             * is enough to update the count.
             *
             * If it is open, the thread socket will deliver
             * the actual reply.
             */
          }

          return;
        }
      },
      [
        discussions,
        updateDiscussion,
        upsertDiscussion,
      ],
    );


  // ==========================================================
  // THREAD SOCKET EVENT HANDLER
  // ==========================================================

  const handleThreadSocketMessage =
    useCallback(
      (
        event: SocketEvent,
      ) => {
        const type =
          safeString(
            event.type,
          ).toLowerCase();

        const data =
          event.data ??
          event;

        const currentThreadId =
          expandedThreadRef.current;

        console.log(
          "📩 [DiscussionForum] THREAD WS:",
          type,
          data,
        );


        if (
          !currentThreadId
        ) {
          return;
        }


        // ------------------------------------------------------
        // NEW REPLY
        // ------------------------------------------------------

        if (
          type ===
          "discussion_reply_created"
        ) {
          const threadId =
            safeNumber(
              data?.thread_id ??
                data?.threadId ??
                currentThreadId,
            );

          if (
            threadId !==
            currentThreadId
          ) {
            return;
          }

          const reply =
            normalizeReply(
              data,
            );

          if (
            !reply.id
          ) {
            return;
          }

          /*
           * Upsert instead of blindly appending.
           *
           * This is critical because the current browser itself
           * also receives the WebSocket event for its own reply.
           */
          upsertReply(
            threadId,
            reply,
          );

          /*
           * Do NOT blindly +1 here if the reply already exists.
           * We determine whether it was new.
           */
          setDiscussions(
            (previous) =>
              previous.map(
                (thread) => {
                  if (
                    thread.id !==
                    threadId
                  ) {
                    return thread;
                  }

                  const currentReplies =
                    replies[
                      threadId
                    ] || [];

                  const alreadyExists =
                    currentReplies.some(
                      (item) =>
                        item.id ===
                        reply.id,
                    );

                  if (
                    alreadyExists
                  ) {
                    return {
                      ...thread,
                      latest_reply:
                        reply,
                    };
                  }

                  return {
                    ...thread,
                    reply_count:
                      safeNumber(
                        thread.reply_count,
                      ) + 1,
                    latest_reply:
                      reply,
                  };
                },
              ),
          );

          return;
        }


        // ------------------------------------------------------
        // UPDATED THREAD
        // ------------------------------------------------------

        if (
          type ===
          "discussion_thread_updated"
        ) {
          const thread =
            normalizeThread(
              data,
            );

          if (
            thread.id
          ) {
            upsertDiscussion(
              thread,
            );
          }

          return;
        }


        // ------------------------------------------------------
        // THREAD VOTE
        //
        // Backend sends:
        //
        // target_type: "thread"
        // target_id
        // upvotes
        // downvotes
        // user_vote
        //
        // ------------------------------------------------------

        if (
          type ===
          "discussion_vote_update"
        ) {
          const targetType =
            safeString(
              data?.target_type,
            ).toLowerCase();

          const targetId =
            safeNumber(
              data?.target_id,
            );

          const upvotes =
            safeNumber(
              data?.upvotes,
            );

          const downvotes =
            safeNumber(
              data?.downvotes,
            );

          const voteCount =
            upvotes -
            downvotes;

          const userVote =
            normalizeVote(
              data?.user_vote,
            );


          if (
            targetType ===
              "thread" &&
            targetId
          ) {
            updateDiscussion(
              targetId,
              {
                vote_count:
                  voteCount,
                user_vote:
                  userVote,
              },
            );

            return;
          }


          // ----------------------------------------------------
          // REPLY VOTE
          // ----------------------------------------------------

          if (
            targetType ===
              "reply" &&
            targetId
          ) {
            setReplies(
              (previous) => ({
                ...previous,
                [currentThreadId]:
                  (
                    previous[
                      currentThreadId
                    ] || []
                  ).map(
                    (reply) =>
                      reply.id ===
                      targetId
                        ? {
                            ...reply,
                            vote_count:
                              voteCount,
                            user_vote:
                              userVote,
                          }
                        : reply,
                  ),
              }),
            );

            return;
          }

          return;
        }


        // ------------------------------------------------------
        // ANSWER MARKED
        //
        // Backend sends:
        //
        // reply_id
        // thread_id
        // previous_answer_id
        //
        // ------------------------------------------------------

        if (
          type ===
          "discussion_answer_marked"
        ) {
          const threadId =
            safeNumber(
              data?.thread_id ??
                currentThreadId,
            );

          const replyId =
            safeNumber(
              data?.reply_id,
            );

          const previousAnswerId =
            safeNumber(
              data?.previous_answer_id,
            );


          if (
            threadId !==
            currentThreadId ||
            !replyId
          ) {
            return;
          }

          setReplies(
            (previous) => ({
              ...previous,
              [threadId]:
                (
                  previous[
                    threadId
                  ] || []
                ).map(
                  (reply) => ({
                    ...reply,
                    is_answer:
                      reply.id ===
                      replyId,
                  }),
                ),
            }),
          );

          /*
           * Keep latest_reply's answer status synchronized.
           */
          setDiscussions(
            (previous) =>
              previous.map(
                (thread) => {
                  if (
                    thread.id !==
                    threadId
                  ) {
                    return thread;
                  }

                  const latest =
                    thread.latest_reply;

                  if (
                    !latest
                  ) {
                    return thread;
                  }

                  if (
                    latest.id ===
                    replyId
                  ) {
                    return {
                      ...thread,
                      latest_reply:
                        {
                          ...latest,
                          is_answer:
                            true,
                        },
                    };
                  }

                  if (
                    previousAnswerId &&
                    latest.id ===
                      previousAnswerId
                  ) {
                    return {
                      ...thread,
                      latest_reply:
                        {
                          ...latest,
                          is_answer:
                            false,
                        },
                    };
                  }

                  return thread;
                },
              ),
          );

          return;
        }


        // ------------------------------------------------------
        // THREAD PIN
        // ------------------------------------------------------

        if (
          type ===
            "discussion_thread_pin_toggled" ||
          type ===
            "thread_pin_toggled"
        ) {
          const threadId =
            safeNumber(
              data?.thread_id ??
                data?.threadId ??
                data?.id ??
                currentThreadId,
            );

          if (
            threadId
          ) {
            updateDiscussion(
              threadId,
              {
                is_pinned:
                  safeBoolean(
                    data?.is_pinned ??
                      data?.isPinned,
                  ),
              },
            );
          }

          return;
        }


        // ------------------------------------------------------
        // THREAD CLOSE
        // ------------------------------------------------------

        if (
          type ===
            "discussion_thread_close_toggled" ||
          type ===
            "thread_close_toggled"
        ) {
          const threadId =
            safeNumber(
              data?.thread_id ??
                data?.threadId ??
                data?.id ??
                currentThreadId,
            );

          if (
            threadId
          ) {
            updateDiscussion(
              threadId,
              {
                is_closed:
                  safeBoolean(
                    data?.is_closed ??
                      data?.isClosed,
                  ),
              },
            );
          }

          return;
        }


        // ------------------------------------------------------
        // REPLY UPDATED
        // ------------------------------------------------------

        if (
          type ===
          "discussion_reply_updated"
        ) {
          const threadId =
            safeNumber(
              data?.thread_id ??
                data?.threadId ??
                currentThreadId,
            );

          const reply =
            normalizeReply(
              data,
            );

          if (
            threadId ===
              currentThreadId &&
            reply.id
          ) {
            upsertReply(
              threadId,
              reply,
            );
          }

          return;
        }


        // ------------------------------------------------------
        // REPLY DELETED
        // ------------------------------------------------------

        if (
          type ===
          "discussion_reply_deleted"
        ) {
          const threadId =
            safeNumber(
              data?.thread_id ??
                data?.threadId ??
                currentThreadId,
            );

          const replyId =
            safeNumber(
              data?.reply_id ??
                data?.replyId ??
                data?.id,
            );

          if (
            threadId ===
              currentThreadId &&
            replyId
          ) {
            removeReply(
              threadId,
              replyId,
            );

            updateDiscussion(
              threadId,
              {
                reply_count:
                  Math.max(
                    0,
                    safeNumber(
                      discussions.find(
                        (thread) =>
                          thread.id ===
                          threadId,
                      )?.reply_count,
                    ) - 1,
                  ),
              },
            );
          }

          return;
        }
      },
      [
        discussions,
        removeReply,
        updateDiscussion,
        upsertDiscussion,
        upsertReply,
      ],
    );


  // ==========================================================
  // COURSE WEBSOCKET CONNECTOR
  // ==========================================================

  const connectCourseSocket =
    useCallback(
      () => {
        if (
          !courseId ||
          typeof window ===
            "undefined"
        ) {
          return;
        }

        /*
         * Close previous socket before creating a new one.
         */
        if (
          courseSocketRef.current
        ) {
          courseSocketRef.current.close();
          courseSocketRef.current =
            null;
        }

        if (
          reconnectCourseTimerRef.current
        ) {
          clearTimeout(
            reconnectCourseTimerRef.current,
          );

          reconnectCourseTimerRef.current =
            null;
        }

        const generation =
          ++courseSocketGenerationRef.current;

        const url =
          createSocketUrl(
            COURSE_WS_PATH(
              courseId,
            ),
          );

        console.log(
          "🔌 [DiscussionForum] Connecting COURSE WebSocket:",
          url.replace(
            /token=[^&]+/,
            "token=***",
          ),
        );

        setCourseSocketState(
          "connecting",
        );

        const socket =
          new WebSocket(
            url,
          );

        courseSocketRef.current =
          socket;


        socket.onopen =
          () => {
            if (
              generation !==
              courseSocketGenerationRef.current
            ) {
              return;
            }

            console.log(
              "✅ [DiscussionForum] COURSE WebSocket connected",
            );

            setCourseSocketState(
              "connected",
            );
          };


        socket.onmessage =
          (
            event,
          ) => {
            if (
              generation !==
              courseSocketGenerationRef.current
            ) {
              return;
            }

            const message =
              parseSocketMessage(
                event,
              );

            if (
              message
            ) {
              handleCourseSocketMessage(
                message,
              );
            }
          };


        socket.onerror =
          (
            error,
          ) => {
            console.error(
              "❌ [DiscussionForum] COURSE WebSocket error:",
              error,
            );

            if (
              generation ===
              courseSocketGenerationRef.current
            ) {
              setCourseSocketState(
                "error",
              );
            }
          };


        socket.onclose =
          (
            event,
          ) => {
            if (
              generation !==
              courseSocketGenerationRef.current
            ) {
              return;
            }

            console.log(
              "🔌 [DiscussionForum] COURSE WebSocket closed:",
              event.code,
              event.reason,
            );

            courseSocketRef.current =
              null;

            setCourseSocketState(
              "disconnected",
            );


            /*
             * Reconnect automatically.
             *
             * Only while this component is mounted.
             */
            if (
              mountedRef.current
            ) {
              reconnectCourseTimerRef.current =
                setTimeout(
                  () => {
                    if (
                      mountedRef.current &&
                      generation ===
                        courseSocketGenerationRef.current
                    ) {
                      connectCourseSocket();
                    }
                  },
                  3000,
                );
            }
          };
      },
      [
        courseId,
        handleCourseSocketMessage,
      ],
    );


  // ==========================================================
  // COURSE SOCKET LIFECYCLE
  // ==========================================================

  useEffect(() => {
    connectCourseSocket();

    return () => {
      ++courseSocketGenerationRef.current;

      if (
        reconnectCourseTimerRef.current
      ) {
        clearTimeout(
          reconnectCourseTimerRef.current,
        );

        reconnectCourseTimerRef.current =
          null;
      }

      if (
        courseSocketRef.current
      ) {
        console.log(
          "🔌 [DiscussionForum] Disconnecting COURSE WebSocket",
        );

        courseSocketRef.current.close();
        courseSocketRef.current =
          null;
      }

      setCourseSocketState(
        "disconnected",
      );
    };
  }, [
    connectCourseSocket,
  ]);


  // ==========================================================
  // THREAD WEBSOCKET CONNECTOR
  // ==========================================================

  const connectThreadSocket =
    useCallback(
      (
        threadId: number,
      ) => {
        if (
          !threadId ||
          typeof window ===
            "undefined"
        ) {
          return;
        }


        if (
          threadSocketRef.current
        ) {
          threadSocketRef.current.close();

          threadSocketRef.current =
            null;
        }


        if (
          reconnectThreadTimerRef.current
        ) {
          clearTimeout(
            reconnectThreadTimerRef.current,
          );

          reconnectThreadTimerRef.current =
            null;
        }


        const generation =
          ++threadSocketGenerationRef.current;


        const url =
          createSocketUrl(
            THREAD_WS_PATH(
              threadId,
            ),
          );


        console.log(
          "🔌 [DiscussionForum] Connecting THREAD WebSocket:",
          url.replace(
            /token=[^&]+/,
            "token=***",
          ),
        );


        setThreadSocketState(
          "connecting",
        );


        const socket =
          new WebSocket(
            url,
          );


        threadSocketRef.current =
          socket;


        socket.onopen =
          () => {
            if (
              generation !==
              threadSocketGenerationRef.current
            ) {
              return;
            }

            console.log(
              `✅ [DiscussionForum] THREAD WebSocket connected: ${threadId}`,
            );

            setThreadSocketState(
              "connected",
            );
          };


        socket.onmessage =
          (
            event,
          ) => {
            if (
              generation !==
              threadSocketGenerationRef.current
            ) {
              return;
            }

            const message =
              parseSocketMessage(
                event,
              );

            if (
              message
            ) {
              handleThreadSocketMessage(
                message,
              );
            }
          };


        socket.onerror =
          (
            error,
          ) => {
            console.error(
              `❌ [DiscussionForum] THREAD WebSocket error: ${threadId}`,
              error,
            );

            if (
              generation ===
              threadSocketGenerationRef.current
            ) {
              setThreadSocketState(
                "error",
              );
            }
          };


        socket.onclose =
          (
            event,
          ) => {
            if (
              generation !==
              threadSocketGenerationRef.current
            ) {
              return;
            }

            console.log(
              `🔌 [DiscussionForum] THREAD WebSocket closed: ${threadId}`,
              event.code,
              event.reason,
            );

            threadSocketRef.current =
              null;

            setThreadSocketState(
              "disconnected",
            );


            /*
             * Reconnect only if the same thread is still open.
             */
            if (
              mountedRef.current &&
              expandedThreadRef.current ===
                threadId
            ) {
              reconnectThreadTimerRef.current =
                setTimeout(
                  () => {
                    if (
                      mountedRef.current &&
                      expandedThreadRef.current ===
                        threadId
                    ) {
                      connectThreadSocket(
                        threadId,
                      );
                    }
                  },
                  3000,
                );
            }
          };
      },
      [
        handleThreadSocketMessage,
      ],
    );


  // ==========================================================
  // THREAD SOCKET LIFECYCLE
  //
  // Only the currently expanded discussion gets a thread
  // WebSocket.
  // ==========================================================

  useEffect(() => {
    if (
      !expandedThread
    ) {
      ++threadSocketGenerationRef.current;

      if (
        reconnectThreadTimerRef.current
      ) {
        clearTimeout(
          reconnectThreadTimerRef.current,
        );

        reconnectThreadTimerRef.current =
          null;
      }

      if (
        threadSocketRef.current
      ) {
        threadSocketRef.current.close();

        threadSocketRef.current =
          null;
      }

      setThreadSocketState(
        "disconnected",
      );

      return;
    }


    connectThreadSocket(
      expandedThread,
    );


    return () => {
      ++threadSocketGenerationRef.current;

      if (
        reconnectThreadTimerRef.current
      ) {
        clearTimeout(
          reconnectThreadTimerRef.current,
        );

        reconnectThreadTimerRef.current =
          null;
      }

      if (
        threadSocketRef.current
      ) {
        threadSocketRef.current.close();

        threadSocketRef.current =
          null;
      }

      setThreadSocketState(
        "disconnected",
      );
    };
  }, [
    expandedThread,
    connectThreadSocket,
  ]);


  // ==========================================================
  // TOGGLE REPLIES
  // ==========================================================

  const toggleReplies =
    useCallback(
      async (
        threadId: number,
      ) => {
        if (
          expandedThread ===
          threadId
        ) {
          setExpandedThread(
            null,
          );

          expandedThreadRef.current =
            null;

          return;
        }


        setExpandedThread(
          threadId,
        );

        expandedThreadRef.current =
          threadId;


        /*
         * Always load REST state when opening a thread.
         *
         * After that, WebSocket becomes authoritative.
         */
        setReplies(
          (previous) => ({
            ...previous,
          }),
        );


        if (
          !replies[threadId]
        ) {
          await loadReplies(
            threadId,
          );
        }
      },
      [
        expandedThread,
        loadReplies,
        replies,
      ],
    );


  // ==========================================================
  // CREATE DISCUSSION
  // ==========================================================

  const handleCreateDiscussion =
    async (
      event: FormEvent,
    ) => {
      event.preventDefault();


      const cleanTitle =
        title.trim();

      const cleanContent =
        content.trim();


      if (
        !cleanTitle ||
        !cleanContent
      ) {
        toast.error(
          "Title and question are required.",
        );

        return;
      }


      try {
        setCreating(true);


        const response =
          await createDiscussion(
            courseId,
            {
              title:
                cleanTitle,
              content:
                cleanContent,
            },
          );


        console.log(
          "[DiscussionForum] create response:",
          response,
        );


        const created =
          extractObject<DiscussionThread>(
            response,
          );


        if (
          created?.id
        ) {
          /*
           * Insert locally immediately.
           *
           * When the WebSocket event arrives,
           * upsertDiscussion() sees the same ID and
           * updates instead of duplicating it.
           */
          upsertDiscussion(
            created,
          );
        }


        setTitle("");
        setContent("");


        toast.success(
          "Discussion posted.",
        );

      } catch (
        error: any
      ) {
        console.error(
          "Failed to create discussion:",
          error,
        );

        toast.error(
          error?.response
            ?.data
            ?.detail ||
            error?.response
              ?.data
              ?.message ||
            "Unable to create discussion.",
        );
      } finally {
        setCreating(false);
      }
    };


  // ==========================================================
  // REPLY
  // ==========================================================

  const handleReply =
    async (
      threadId: number,
    ) => {
      const cleanReply =
        replyText.trim();


      if (!cleanReply) {
        toast.error(
          "Reply cannot be empty.",
        );

        return;
      }


      const thread =
        discussions.find(
          (item) =>
            item.id ===
            threadId,
        );


      if (
        thread?.is_closed
      ) {
        toast.error(
          "This discussion is closed.",
        );

        return;
      }


      try {
        setReplyLoading(
          threadId,
        );


        const response =
          await createDiscussionReply(
            threadId,
            {
              content:
                cleanReply,
            },
          );


        console.log(
          `[DiscussionForum] reply response for ${threadId}:`,
          response,
        );


        const created =
          extractObject<DiscussionReply>(
            response,
          );


        if (
          created?.id
        ) {
          /*
           * Add locally immediately.
           *
           * The WebSocket event uses upsertReply(),
           * so no duplicate is produced.
           */
          upsertReply(
            threadId,
            created,
          );


          setDiscussions(
            (previous) =>
              previous.map(
                (item) =>
                  item.id ===
                  threadId
                    ? {
                        ...item,
                        reply_count:
                          safeNumber(
                            item.reply_count,
                          ) + 1,
                        latest_reply:
                          normalizeReply(
                            created,
                          ),
                      }
                    : item,
              ),
          );
        }


        setReplyText("");
        setReplyingTo(
          null,
        );

        setExpandedThread(
          threadId,
        );

        expandedThreadRef.current =
          threadId;


        toast.success(
          "Reply posted.",
        );

      } catch (
        error: any
      ) {
        console.error(
          "Failed to reply:",
          error,
        );

        toast.error(
          error?.response
            ?.data
            ?.detail ||
            error?.response
              ?.data
              ?.message ||
            "Unable to post reply.",
        );
      } finally {
        setReplyLoading(
          null,
        );
      }
    };


  // ==========================================================
  // THREAD VOTE
  // ==========================================================

  const handleVoteThread =
    async (
      threadId: number,
      voteType:
        | "up"
        | "down",
    ) => {
      try {
        const response =
          await voteDiscussion(
            threadId,
            voteType,
          );


        const result =
          extractObject<any>(
            response,
          ) || {};


        /*
         * REST response updates this browser immediately.
         *
         * WebSocket will synchronize all other browsers.
         */
        const voteCount =
          safeNumber(
            result.vote_count,
          );

        const userVote =
          normalizeVote(
            result.vote,
          );


        updateDiscussion(
          threadId,
          {
            vote_count:
              voteCount,
            user_vote:
              userVote,
          },
        );

      } catch (
        error
      ) {
        console.error(
          "Failed to vote:",
          error,
        );

        toast.error(
          "Unable to update vote.",
        );
      }
    };


  // ==========================================================
  // REPLY VOTE
  // ==========================================================

  const handleVoteReply =
    async (
      threadId: number,
      replyId: number,
      voteType:
        | "up"
        | "down",
    ) => {
      try {
        const response =
          await voteDiscussionReply(
            replyId,
            voteType,
          );


        const result =
          extractObject<any>(
            response,
          ) || {};


        const voteCount =
          safeNumber(
            result.vote_count,
          );

        const userVote =
          normalizeVote(
            result.vote,
          );


        setReplies(
          (previous) => ({
            ...previous,
            [threadId]:
              (
                previous[
                  threadId
                ] || []
              ).map(
                (reply) =>
                  reply.id ===
                  replyId
                    ? {
                        ...reply,
                        vote_count:
                          voteCount,
                        user_vote:
                          userVote,
                      }
                    : reply,
              ),
          }),
        );

      } catch (
        error
      ) {
        console.error(
          "Failed to vote reply:",
          error,
        );

        toast.error(
          "Unable to update vote.",
        );
      }
    };


  // ==========================================================
  // SOCKET STATUS UI
  // ==========================================================

  const socketStatus =
    useMemo(() => {
      if (
        courseSocketState ===
        "connected"
      ) {
        return {
          label:
            "Live",
          className:
            "bg-emerald-500/10 text-emerald-300 border-emerald-400/20",
          dot:
            "bg-emerald-400",
        };
      }

      if (
        courseSocketState ===
        "connecting"
      ) {
        return {
          label:
            "Connecting",
          className:
            "bg-amber-500/10 text-amber-300 border-amber-400/20",
          dot:
            "bg-amber-400",
        };
      }

      return {
        label:
          "Offline",
        className:
          "bg-red-500/10 text-red-300 border-red-400/20",
        dot:
          "bg-red-400",
      };
    }, [
      courseSocketState,
    ]);


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 shadow-2xl backdrop-blur-xl sm:p-6">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <div className="flex items-center gap-3">

            <h2 className="text-xl font-bold text-white sm:text-2xl">
              Discussion Forum
            </h2>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold ${socketStatus.className}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${socketStatus.dot}`}
              />

              {socketStatus.label}
            </span>

          </div>

          <p className="mt-1 text-sm text-white/50">
            Ask questions, share answers, and learn together.
          </p>
        </div>


        <div className="flex items-center gap-2">

          <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
            {discussions.length} discussion
            {discussions.length === 1
              ? ""
              : "s"}
          </span>


          <button
            type="button"
            onClick={() =>
              loadDiscussions(
                true,
              )
            }
            disabled={
              loading
            }
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/60 transition hover:bg-white/10 disabled:opacity-40"
          >
            {loading
              ? "Loading..."
              : "Refresh"}
          </button>

        </div>

      </div>


      {/* ======================================================
          CREATE DISCUSSION
      ====================================================== */}

      <form
        onSubmit={
          handleCreateDiscussion
        }
        className="mt-5 rounded-xl border border-violet-500/15 bg-violet-500/[0.06] p-4"
      >

        <div className="flex items-center justify-between">

          <h3 className="font-semibold text-white">
            Start a discussion
          </h3>

          {courseSocketState ===
            "connected" && (
            <span className="text-[10px] font-medium text-emerald-300/70">
              ● Real-time enabled
            </span>
          )}

        </div>


        <input
          value={title}
          onChange={(
            event,
          ) =>
            setTitle(
              event.target.value,
            )
          }
          maxLength={200}
          placeholder="What would you like to ask?"
          className="mt-3 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-violet-400/60"
        />


        <textarea
          value={content}
          onChange={(
            event,
          ) =>
            setContent(
              event.target.value,
            )
          }
          rows={3}
          maxLength={5000}
          placeholder="Describe your question or share something with the class..."
          className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-violet-400/60"
        />


        <div className="mt-3 flex justify-end">

          <button
            type="submit"
            disabled={
              creating
            }
            className="rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating
              ? "Posting..."
              : "+ Ask Question"}
          </button>

        </div>

      </form>


      {/* ======================================================
          LOADING
      ====================================================== */}

      {loading ? (

        <div className="space-y-4 py-6">

          {[1, 2, 3].map(
            (item) => (
              <div
                key={item}
                className="animate-pulse rounded-xl border border-white/10 bg-white/5 p-5"
              >
                <div className="h-5 w-2/3 rounded bg-white/10" />

                <div className="mt-3 h-4 w-full rounded bg-white/10" />

                <div className="mt-2 h-4 w-4/5 rounded bg-white/10" />
              </div>
            ),
          )}

        </div>

      ) : discussions.length === 0 ? (

        /* ====================================================
           EMPTY
        ==================================================== */

        <div className="py-12 text-center">

          <div className="text-4xl">
            💬
          </div>

          <p className="mt-3 font-semibold text-white">
            No discussions yet
          </p>

          <p className="mt-1 text-sm text-white/40">
            Be the first student to ask a question.
          </p>

        </div>

      ) : (

        /* ====================================================
           DISCUSSION LIST
        ==================================================== */

        <div className="mt-5 space-y-4">

          {discussions.map(
            (
              thread,
            ) => {

              const threadReplies =
                replies[
                  thread.id
                ] || [];

              const isExpanded =
                expandedThread ===
                thread.id;

              const tutor =
                isCourseTutor(
                  thread.user,
                  thread,
                );


              return (
                <article
                  key={
                    thread.id
                  }
                  className="rounded-xl border border-white/10 bg-white/[0.025] p-4 transition hover:border-violet-400/20 sm:p-5"
                >

                  {/* ==================================================
                      BADGES
                  ================================================== */}

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


                  {/* ==================================================
                      TITLE
                  ================================================== */}

                  <h3 className="mt-3 text-lg font-bold text-white">
                    {thread.title}
                  </h3>


                  {/* ==================================================
                      CONTENT
                  ================================================== */}

                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-white/65">
                    {thread.content}
                  </p>


                  {/* ==================================================
                      AUTHOR
                  ================================================== */}

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/40">

                    <div className="flex items-center gap-2">

                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          tutor
                            ? "bg-gradient-to-br from-emerald-500/30 to-teal-500/30 text-emerald-200"
                            : "bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 text-violet-200"
                        }`}
                      >
                        {getUserInitial(
                          thread.user,
                        )}
                      </div>


                      <span className="font-semibold text-white/80">
                        {getUserDisplayName(
                          thread.user,
                        )}
                      </span>


                      <UserRoleBadge
                        isTutor={
                          tutor
                        }
                      />

                    </div>


                    <span>
                      •
                    </span>

                    <span>
                      {formatDate(
                        thread.created_at,
                      )}
                    </span>

                    <span>
                      •
                    </span>

                    <span>
                      {safeNumber(
                        thread.views,
                      )}{" "}
                      views
                    </span>

                    <span>
                      •
                    </span>

                    <span>
                      {safeNumber(
                        thread.reply_count,
                      )}{" "}
                      replies
                    </span>

                  </div>


                  {/* ==================================================
                      ACTIONS
                  ================================================== */}

                  <div className="mt-4 flex flex-wrap items-center gap-2">

                    {/* UPVOTE */}

                    <button
                      type="button"
                      onClick={() =>
                        handleVoteThread(
                          thread.id,
                          "up",
                        )
                      }
                      className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        thread.user_vote ===
                        "up"
                          ? "bg-violet-500/20 text-violet-300"
                          : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      👍{" "}
                      {safeNumber(
                        thread.vote_count,
                      )}
                    </button>


                    {/* DOWNVOTE */}

                    <button
                      type="button"
                      onClick={() =>
                        handleVoteThread(
                          thread.id,
                          "down",
                        )
                      }
                      className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        thread.user_vote ===
                        "down"
                          ? "bg-red-500/20 text-red-300"
                          : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      👎
                    </button>


                    {/* VIEW REPLIES */}

                    <button
                      type="button"
                      onClick={() =>
                        toggleReplies(
                          thread.id,
                        )
                      }
                      className="rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
                    >
                      {isExpanded
                        ? "Hide Replies"
                        : `View Replies${
                            safeNumber(
                              thread.reply_count,
                            ) > 0
                              ? ` (${safeNumber(
                                  thread.reply_count,
                                )})`
                              : ""
                          }`}
                    </button>


                    {/* REPLY */}

                    {!thread.is_closed && (
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingTo(
                            replyingTo ===
                              thread.id
                              ? null
                              : thread.id,
                          );

                          setExpandedThread(
                            thread.id,
                          );

                          expandedThreadRef.current =
                            thread.id;

                          if (
                            !replies[
                              thread.id
                            ]
                          ) {
                            loadReplies(
                              thread.id,
                            );
                          }
                        }}
                        className="rounded-lg bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-300 transition hover:bg-violet-500/20"
                      >
                        Reply
                      </button>
                    )}

                  </div>


                  {/* ==================================================
                      EXPANDED REPLIES
                  ================================================== */}

                  {isExpanded && (

                    <div className="mt-5 border-t border-white/10 pt-4">

                      {/* THREAD SOCKET STATUS */}

                      <div className="mb-3 flex items-center justify-between">

                        <span className="text-xs font-semibold text-white/60">
                          Replies
                        </span>

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[9px] ${
                            threadSocketState ===
                            "connected"
                              ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                              : threadSocketState ===
                                "connecting"
                              ? "border-amber-400/20 bg-amber-500/10 text-amber-300"
                              : "border-white/10 bg-white/5 text-white/35"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              threadSocketState ===
                              "connected"
                                ? "bg-emerald-400"
                                : threadSocketState ===
                                  "connecting"
                                ? "bg-amber-400"
                                : "bg-white/30"
                            }`}
                          />

                          {threadSocketState ===
                          "connected"
                            ? "Live replies"
                            : threadSocketState ===
                              "connecting"
                            ? "Connecting..."
                            : "Offline"}
                        </span>

                      </div>


                      {/* ==================================================
                          REPLY BOX
                      ================================================== */}

                      {replyingTo ===
                        thread.id &&
                        !thread.is_closed && (

                        <div className="mb-4">

                          <textarea
                            value={
                              replyText
                            }
                            onChange={(
                              event,
                            ) =>
                              setReplyText(
                                event.target.value,
                              )
                            }
                            rows={3}
                            maxLength={
                              5000
                            }
                            placeholder="Write your reply..."
                            className="w-full resize-none rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-violet-400/60"
                          />


                          <div className="mt-2 flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() => {
                                setReplyingTo(
                                  null,
                                );

                                setReplyText(
                                  "",
                                );
                              }}
                              className="rounded-lg bg-white/5 px-4 py-2 text-xs text-white/60 hover:bg-white/10"
                            >
                              Cancel
                            </button>


                            <button
                              type="button"
                              disabled={
                                replyLoading ===
                                thread.id
                              }
                              onClick={() =>
                                handleReply(
                                  thread.id,
                                )
                              }
                              className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-50"
                            >
                              {replyLoading ===
                              thread.id
                                ? "Posting..."
                                : "Post Reply"}
                            </button>

                          </div>

                        </div>
                      )}


                      {/* ==================================================
                          REPLY LIST
                      ================================================== */}

                      {threadReplies.length ===
                      0 ? (

                        <p className="py-4 text-center text-sm text-white/35">
                          No replies yet.
                        </p>

                      ) : (

                        <div className="space-y-3">

                          {threadReplies.map(
                            (
                              reply,
                            ) => {

                              const replyTutor =
                                isCourseTutor(
                                  reply.user,
                                  {
                                    ...reply,
                                    thread,
                                  },
                                );


                              return (
                                <div
                                  key={
                                    reply.id
                                  }
                                  className={`rounded-lg border p-4 ${
                                    reply.is_answer
                                      ? "border-emerald-400/20 bg-emerald-500/[0.04]"
                                      : "border-white/10 bg-black/10"
                                  }`}
                                >

                                  <div className="flex flex-wrap items-center gap-2 text-xs text-white/40">

                                    <div className="flex items-center gap-2">

                                      <div
                                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                                          replyTutor
                                            ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-200"
                                            : "bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-violet-200"
                                        }`}
                                      >
                                        {getUserInitial(
                                          reply.user,
                                        )}
                                      </div>


                                      <span className="font-semibold text-white/80">
                                        {getUserDisplayName(
                                          reply.user,
                                        )}
                                      </span>


                                      <UserRoleBadge
                                        isTutor={
                                          replyTutor
                                        }
                                      />

                                    </div>


                                    {reply.is_answer && (
                                      <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-300">
                                        ✓ Answer
                                      </span>
                                    )}


                                    <span>
                                      {formatDate(
                                        reply.created_at,
                                      )}
                                    </span>

                                  </div>


                                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-white/65">
                                    {reply.content}
                                  </p>


                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleVoteReply(
                                        thread.id,
                                        reply.id,
                                        "up",
                                      )
                                    }
                                    className={`mt-3 rounded-lg px-3 py-1.5 text-xs ${
                                      reply.user_vote ===
                                      "up"
                                        ? "bg-violet-500/20 text-violet-300"
                                        : "bg-white/5 text-white/50 hover:bg-white/10"
                                    }`}
                                  >
                                    👍{" "}
                                    {safeNumber(
                                      reply.vote_count,
                                    )}
                                  </button>

                                </div>
                              );
                            },
                          )}

                        </div>
                      )}

                    </div>
                  )}

                </article>
              );
            },
          )}

        </div>
      )}

    </section>
  );
}