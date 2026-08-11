import { WS_BASE_URL } from "@/config/env";

let chatSocket: WebSocket | null = null;

type SocketCallback = () => void;

export const connectChatSocket = (
  sessionId: number,
  token: string,
  onMessage: (data: any) => void,
  onConnected?: SocketCallback,
  onDisconnected?: SocketCallback
) => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("💬 CONNECT CHAT SOCKET CALLED");
  console.log("💬 Session ID:", sessionId);
  console.log("💬 Token exists:", !!token);
  console.log("💬 WS_BASE_URL:", WS_BASE_URL);

  if (!sessionId) {
    console.error(
      "❌ Cannot connect chat socket: sessionId missing"
    );
    return;
  }

  if (!token) {
    console.error(
      "❌ Cannot connect chat socket: token missing"
    );
    return;
  }

  // Prevent duplicate connections
  if (
    chatSocket &&
    (
      chatSocket.readyState === WebSocket.OPEN ||
      chatSocket.readyState === WebSocket.CONNECTING
    )
  ) {
    console.log(
      "⚠️ Chat WS already connected/connecting"
    );
    return;
  }

  const url =
    `${WS_BASE_URL}/ws/chat/${sessionId}/?token=${encodeURIComponent(token)}`;

  console.log(
    "💬 CHAT WS URL:",
    url.replace(/token=.*$/, "token=***")
  );

  const socket = new WebSocket(url);

  chatSocket = socket;

  // -----------------------------------------
  // CONNECTED
  // -----------------------------------------

  socket.onopen = () => {
    console.log(
      "✅💬 CHAT WEBSOCKET CONNECTED"
    );

    onConnected?.();
  };

  // -----------------------------------------
  // MESSAGE
  // -----------------------------------------

  socket.onmessage = (event) => {
    console.log(
      "📩💬 CHAT RAW MESSAGE:",
      event.data
    );

    try {
      const data = JSON.parse(event.data);

      console.log(
        "📩💬 CHAT MESSAGE:",
        data
      );

      onMessage(data);

    } catch (error) {
      console.error(
        "❌ CHAT PARSE ERROR:",
        error
      );
    }
  };

  // -----------------------------------------
  // ERROR
  // -----------------------------------------

  socket.onerror = (error) => {
    console.error(
      "❌💬 CHAT WEBSOCKET ERROR:",
      error
    );
  };

  // -----------------------------------------
  // CLOSED
  // -----------------------------------------

  socket.onclose = (event) => {
    console.log(
      "🔌💬 CHAT WEBSOCKET CLOSED"
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

    if (chatSocket === socket) {
      chatSocket = null;
    }

    onDisconnected?.();
  };
};


// =================================================
// SEND MESSAGE
// =================================================

export const sendChatMessage = (
  payload: {
    type?: string;
    text?: string;
    session_id?: number | string;
    [key: string]: any;
  }
) => {

  if (
    !chatSocket ||
    chatSocket.readyState !== WebSocket.OPEN
  ) {
    console.log(
      "❌ Chat socket not ready"
    );
    return;
  }

  chatSocket.send(
    JSON.stringify({
      ...payload,
      type: payload.type || "text",
    })
  );
};


// =================================================
// TYPING
// =================================================

export const sendTypingStatus = (
  isTyping: boolean
) => {

  if (
    !chatSocket ||
    chatSocket.readyState !== WebSocket.OPEN
  ) {
    return;
  }

  chatSocket.send(
    JSON.stringify({
      type: "typing",
      is_typing: isTyping,
    })
  );
};


// =================================================
// READ RECEIPT
// =================================================

export const sendReadReceipt = (
  messageIds: number[]
) => {

  if (
    !chatSocket ||
    chatSocket.readyState !== WebSocket.OPEN
  ) {
    return;
  }

  chatSocket.send(
    JSON.stringify({
      type: "read",
      message_ids: messageIds,
    })
  );
};


// =================================================
// DISCONNECT
// =================================================

export const disconnectChatSocket = () => {

  if (!chatSocket) {
    return;
  }

  console.log(
    "🔌 Disconnecting chat socket..."
  );

  chatSocket.close();

  chatSocket = null;
};