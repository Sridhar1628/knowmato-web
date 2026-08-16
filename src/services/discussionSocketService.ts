// services/discussionSocketService.ts

import { WS_BASE_URL } from "../config/env";

// ==========================================================
// TYPES
// ==========================================================

type SocketCallback = () => void;

export type DiscussionSocketMessage = {
  type: string;
  data?: any;
  timestamp?: string;
  room_type?: "course" | "thread";
  room_id?: number;
};

type MessageCallback = (
  data: DiscussionSocketMessage
) => void;


// ==========================================================
// SOCKET INSTANCES
// ==========================================================

let courseDiscussionSocket: WebSocket | null = null;

let threadDiscussionSocket: WebSocket | null = null;


// ==========================================================
// CONNECTION STATE HELPERS
// ==========================================================

const isSocketOpenOrConnecting = (
  socket: WebSocket | null
): boolean => {
  return (
    socket !== null &&
    (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    )
  );
};


// ==========================================================
// COURSE DISCUSSION SOCKET
//
// Backend:
// /ws/discussion/course/<course_id>/?token=<JWT>
// ==========================================================

export const connectCourseDiscussionSocket = (
  courseId: number,
  token: string,
  onMessage: MessageCallback,
  onConnected?: SocketCallback,
  onDisconnected?: SocketCallback,
) => {
  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  );

  console.log(
    "💬📡 CONNECT COURSE DISCUSSION SOCKET"
  );

  console.log(
    "💬 Course ID:",
    courseId
  );

  console.log(
    "💬 Token exists:",
    !!token
  );

  console.log(
    "💬 Token length:",
    token?.length
  );

  console.log(
    "💬 WS_BASE_URL:",
    WS_BASE_URL
  );


  // --------------------------------------------------------
  // VALIDATION
  // --------------------------------------------------------

  if (!courseId) {
    console.error(
      "❌ Course discussion socket: courseId missing"
    );

    return;
  }

  if (!token) {
    console.error(
      "❌ Course discussion socket: token missing"
    );

    return;
  }


  // --------------------------------------------------------
  // PREVENT DUPLICATE CONNECTION
  // --------------------------------------------------------

  if (
    isSocketOpenOrConnecting(
      courseDiscussionSocket
    )
  ) {
    console.log(
      "⚠️ Course discussion socket already connected/connecting"
    );

    return;
  }


  // --------------------------------------------------------
  // CREATE URL
  // --------------------------------------------------------

  const url =
    `${WS_BASE_URL}/ws/discussion/course/${courseId}/?token=${encodeURIComponent(token)}`;


  console.log(
    "💬📡 COURSE DISCUSSION WS URL:",
    url.replace(
      /token=.*$/,
      "token=***"
    )
  );


  // --------------------------------------------------------
  // CREATE SOCKET
  // --------------------------------------------------------

  const socket = new WebSocket(url);

  courseDiscussionSocket = socket;


  // --------------------------------------------------------
  // CONNECTED
  // --------------------------------------------------------

  socket.onopen = () => {
    console.log(
      "✅💬 COURSE DISCUSSION WEBSOCKET CONNECTED"
    );

    onConnected?.();
  };


  // --------------------------------------------------------
  // MESSAGE
  // --------------------------------------------------------

  socket.onmessage = (event) => {
    console.log(
      "📩💬 COURSE DISCUSSION RAW MESSAGE:",
      event.data
    );

    try {
      const data: DiscussionSocketMessage =
        JSON.parse(event.data);

      console.log(
        "📩💬 COURSE DISCUSSION MESSAGE:",
        data
      );

      onMessage(data);

    } catch (error) {
      console.error(
        "❌ COURSE DISCUSSION JSON PARSE ERROR:",
        error
      );
    }
  };


  // --------------------------------------------------------
  // ERROR
  // --------------------------------------------------------

  socket.onerror = (error) => {
    console.error(
      "❌💬 COURSE DISCUSSION WEBSOCKET ERROR:",
      error
    );
  };


  // --------------------------------------------------------
  // CLOSED
  // --------------------------------------------------------

  socket.onclose = (event) => {
    console.log(
      "🔌💬 COURSE DISCUSSION WEBSOCKET CLOSED"
    );

    console.log(
      "🔌 Close code:",
      event.code
    );

    console.log(
      "🔌 Close reason:",
      event.reason
    );

    console.log(
      "🔌 Clean:",
      event.wasClean
    );

    if (
      courseDiscussionSocket === socket
    ) {
      courseDiscussionSocket = null;
    }

    onDisconnected?.();
  };
};


// ==========================================================
// THREAD DISCUSSION SOCKET
//
// Backend:
// /ws/discussion/thread/<thread_id>/?token=<JWT>
// ==========================================================

export const connectThreadDiscussionSocket = (
  threadId: number,
  token: string,
  onMessage: MessageCallback,
  onConnected?: SocketCallback,
  onDisconnected?: SocketCallback,
) => {
  console.log(
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  );

  console.log(
    "💬📡 CONNECT THREAD DISCUSSION SOCKET"
  );

  console.log(
    "💬 Thread ID:",
    threadId
  );

  console.log(
    "💬 Token exists:",
    !!token
  );

  console.log(
    "💬 Token length:",
    token?.length
  );

  console.log(
    "💬 WS_BASE_URL:",
    WS_BASE_URL
  );


  // --------------------------------------------------------
  // VALIDATION
  // --------------------------------------------------------

  if (!threadId) {
    console.error(
      "❌ Thread discussion socket: threadId missing"
    );

    return;
  }

  if (!token) {
    console.error(
      "❌ Thread discussion socket: token missing"
    );

    return;
  }


  // --------------------------------------------------------
  // PREVENT DUPLICATE CONNECTION
  // --------------------------------------------------------

  if (
    isSocketOpenOrConnecting(
      threadDiscussionSocket
    )
  ) {
    console.log(
      "⚠️ Thread discussion socket already connected/connecting"
    );

    return;
  }


  // --------------------------------------------------------
  // CREATE URL
  // --------------------------------------------------------

  const url =
    `${WS_BASE_URL}/ws/discussion/thread/${threadId}/?token=${encodeURIComponent(token)}`;


  console.log(
    "💬📡 THREAD DISCUSSION WS URL:",
    url.replace(
      /token=.*$/,
      "token=***"
    )
  );


  // --------------------------------------------------------
  // CREATE SOCKET
  // --------------------------------------------------------

  const socket = new WebSocket(url);

  threadDiscussionSocket = socket;


  // --------------------------------------------------------
  // CONNECTED
  // --------------------------------------------------------

  socket.onopen = () => {
    console.log(
      "✅💬 THREAD DISCUSSION WEBSOCKET CONNECTED"
    );

    onConnected?.();
  };


  // --------------------------------------------------------
  // MESSAGE
  // --------------------------------------------------------

  socket.onmessage = (event) => {
    console.log(
      "📩💬 THREAD DISCUSSION RAW MESSAGE:",
      event.data
    );

    try {
      const data: DiscussionSocketMessage =
        JSON.parse(event.data);

      console.log(
        "📩💬 THREAD DISCUSSION MESSAGE:",
        data
      );

      onMessage(data);

    } catch (error) {
      console.error(
        "❌ THREAD DISCUSSION JSON PARSE ERROR:",
        error
      );
    }
  };


  // --------------------------------------------------------
  // ERROR
  // --------------------------------------------------------

  socket.onerror = (error) => {
    console.error(
      "❌💬 THREAD DISCUSSION WEBSOCKET ERROR:",
      error
    );
  };


  // --------------------------------------------------------
  // CLOSED
  // --------------------------------------------------------

  socket.onclose = (event) => {
    console.log(
      "🔌💬 THREAD DISCUSSION WEBSOCKET CLOSED"
    );

    console.log(
      "🔌 Close code:",
      event.code
    );

    console.log(
      "🔌 Close reason:",
      event.reason
    );

    console.log(
      "🔌 Clean:",
      event.wasClean
    );

    if (
      threadDiscussionSocket === socket
    ) {
      threadDiscussionSocket = null;
    }

    onDisconnected?.();
  };
};


// ==========================================================
// SEND PING
//
// Optional connection health check.
// Backend responds with:
// { "type": "PONG" }
// ==========================================================

export const sendDiscussionPing = (
  socketType:
    | "course"
    | "thread"
) => {
  const socket =
    socketType === "course"
      ? courseDiscussionSocket
      : threadDiscussionSocket;

  if (
    !socket ||
    socket.readyState !== WebSocket.OPEN
  ) {
    console.log(
      `❌ ${socketType} discussion socket not ready`
    );

    return false;
  }

  socket.send(
    JSON.stringify({
      type: "PING",
    })
  );

  return true;
};


// ==========================================================
// DISCONNECT COURSE DISCUSSION SOCKET
// ==========================================================

export const disconnectCourseDiscussionSocket = () => {
  if (!courseDiscussionSocket) {
    return;
  }

  console.log(
    "🔌 Disconnecting course discussion socket..."
  );

  try {
    courseDiscussionSocket.close();
  } catch (error) {
    console.error(
      "❌ Error closing course discussion socket:",
      error
    );
  }

  courseDiscussionSocket = null;
};


// ==========================================================
// DISCONNECT THREAD DISCUSSION SOCKET
// ==========================================================

export const disconnectThreadDiscussionSocket = () => {
  if (!threadDiscussionSocket) {
    return;
  }

  console.log(
    "🔌 Disconnecting thread discussion socket..."
  );

  try {
    threadDiscussionSocket.close();
  } catch (error) {
    console.error(
      "❌ Error closing thread discussion socket:",
      error
    );
  }

  threadDiscussionSocket = null;
};


// ==========================================================
// DISCONNECT ALL DISCUSSION SOCKETS
// ==========================================================

export const disconnectAllDiscussionSockets = () => {
  console.log(
    "🔌 Disconnecting all discussion sockets..."
  );

  disconnectCourseDiscussionSocket();

  disconnectThreadDiscussionSocket();
};


// ==========================================================
// SOCKET STATUS
// ==========================================================

export const isCourseDiscussionSocketConnected =
  (): boolean => {
    return (
      courseDiscussionSocket !== null &&
      courseDiscussionSocket.readyState ===
        WebSocket.OPEN
    );
  };


export const isThreadDiscussionSocketConnected =
  (): boolean => {
    return (
      threadDiscussionSocket !== null &&
      threadDiscussionSocket.readyState ===
        WebSocket.OPEN
    );
  };