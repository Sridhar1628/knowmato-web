
import { WS_BASE_URL } from "../config/env";

type SocketCallback = () => void;

export type DiscussionSocketMessage = {
  type: string;
  data?: any;
  timestamp?: string;
  room_type?: "course" | "thread";
  room_id?: number;
};

type MessageCallback = (data: DiscussionSocketMessage) => void;

let courseDiscussionSocket: WebSocket | null = null;
let threadDiscussionSocket: WebSocket | null = null;

const isSocketOpenOrConnecting = (
  socket: WebSocket | null
): boolean => {
  return (
    socket !== null &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING)
  );
};

const getDiscussionSocketUrl = (path: string): string => {
  const baseUrl = WS_BASE_URL.replace(/\/+$/, "");
  return `${baseUrl}${path}`;
};

// ==========================================================
// COURSE DISCUSSION SOCKET
// Authentication: browser session cookie
// ==========================================================

export const connectCourseDiscussionSocket = (
  courseId: number,
  _token: string,
  onMessage: MessageCallback,
  onConnected?: SocketCallback,
  onDisconnected?: SocketCallback
) => {
  if (!courseId) {
    console.error("Course discussion socket: courseId missing");
    return;
  }

  if (isSocketOpenOrConnecting(courseDiscussionSocket)) {
    return;
  }

  const url = getDiscussionSocketUrl(
    `/ws/discussion/course/${courseId}/`
  );

  const socket = new WebSocket(url);
  courseDiscussionSocket = socket;

  socket.onopen = () => {
    if (courseDiscussionSocket !== socket) return;
    onConnected?.();
  };

  socket.onmessage = (event) => {
    if (courseDiscussionSocket !== socket) return;

    try {
      const data: DiscussionSocketMessage = JSON.parse(event.data);
      onMessage(data);
    } catch {
      console.error("Unable to parse course discussion message");
    }
  };

  socket.onerror = () => {
    if (courseDiscussionSocket !== socket) return;
    console.error("Course discussion WebSocket error");
  };

  socket.onclose = () => {
    if (courseDiscussionSocket !== socket) return;

    courseDiscussionSocket = null;
    onDisconnected?.();
  };
};

// ==========================================================
// THREAD DISCUSSION SOCKET
// Authentication: browser session cookie
// ==========================================================

export const connectThreadDiscussionSocket = (
  threadId: number,
  _token: string,
  onMessage: MessageCallback,
  onConnected?: SocketCallback,
  onDisconnected?: SocketCallback
) => {
  if (!threadId) {
    console.error("Thread discussion socket: threadId missing");
    return;
  }

  if (isSocketOpenOrConnecting(threadDiscussionSocket)) {
    return;
  }

  const url = getDiscussionSocketUrl(
    `/ws/discussion/thread/${threadId}/`
  );

  const socket = new WebSocket(url);
  threadDiscussionSocket = socket;

  socket.onopen = () => {
    if (threadDiscussionSocket !== socket) return;
    onConnected?.();
  };

  socket.onmessage = (event) => {
    if (threadDiscussionSocket !== socket) return;

    try {
      const data: DiscussionSocketMessage = JSON.parse(event.data);
      onMessage(data);
    } catch {
      console.error("Unable to parse thread discussion message");
    }
  };

  socket.onerror = () => {
    if (threadDiscussionSocket !== socket) return;
    console.error("Thread discussion WebSocket error");
  };

  socket.onclose = () => {
    if (threadDiscussionSocket !== socket) return;

    threadDiscussionSocket = null;
    onDisconnected?.();
  };
};

// ==========================================================
// SEND PING
// ==========================================================

export const sendDiscussionPing = (
  socketType: "course" | "thread"
) => {
  const socket =
    socketType === "course"
      ? courseDiscussionSocket
      : threadDiscussionSocket;

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return false;
  }

  socket.send(JSON.stringify({ type: "PING" }));
  return true;
};

// ==========================================================
// DISCONNECT COURSE DISCUSSION SOCKET
// ==========================================================

export const disconnectCourseDiscussionSocket = () => {
  const socket = courseDiscussionSocket;
  courseDiscussionSocket = null;

  if (socket) {
    try {
      socket.close();
    } catch {
      console.error("Unable to close course discussion socket");
    }
  }
};

// ==========================================================
// DISCONNECT THREAD DISCUSSION SOCKET
// ==========================================================

export const disconnectThreadDiscussionSocket = () => {
  const socket = threadDiscussionSocket;
  threadDiscussionSocket = null;

  if (socket) {
    try {
      socket.close();
    } catch {
      console.error("Unable to close thread discussion socket");
    }
  }
};

// ==========================================================
// DISCONNECT ALL DISCUSSION SOCKETS
// ==========================================================

export const disconnectAllDiscussionSockets = () => {
  disconnectCourseDiscussionSocket();
  disconnectThreadDiscussionSocket();
};

// ==========================================================
// SOCKET STATUS
// ==========================================================

export const isCourseDiscussionSocketConnected = (): boolean => {
  return courseDiscussionSocket?.readyState === WebSocket.OPEN;
};

export const isThreadDiscussionSocketConnected = (): boolean => {
  return threadDiscussionSocket?.readyState === WebSocket.OPEN;
};
