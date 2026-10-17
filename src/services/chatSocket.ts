
import { WS_BASE_URL } from "@/config/env";

let chatSocket: WebSocket | null = null;

type SocketCallback = () => void;

export const connectChatSocket = (
  sessionId: number,
  _token: string,
  onMessage: (data: any) => void,
  onConnected?: SocketCallback,
  onDisconnected?: SocketCallback
) => {
  if (!sessionId) {
    console.error("Cannot connect chat socket: sessionId missing");
    return;
  }

  // Prevent duplicate connections.
  if (
    chatSocket &&
    (
      chatSocket.readyState === WebSocket.OPEN ||
      chatSocket.readyState === WebSocket.CONNECTING
    )
  ) {
    return;
  }

  // Browser WebSocket authentication uses the Django session cookie.
  // Never put access tokens in the URL or query string.
  const baseUrl = WS_BASE_URL.replace(/\/+$/, "");
  const url = `${baseUrl}/ws/chat/${sessionId}/`;

  const socket = new WebSocket(url);
  chatSocket = socket;

  socket.onopen = () => {
    onConnected?.();
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch {
      console.error("Unable to parse chat WebSocket message");
    }
  };

  socket.onerror = () => {
    // Avoid logging socket URLs, message contents, or credentials.
    console.error("Chat WebSocket connection error");
  };

  socket.onclose = () => {
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
  if (!chatSocket || chatSocket.readyState !== WebSocket.OPEN) {
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

export const sendTypingStatus = (isTyping: boolean) => {
  if (!chatSocket || chatSocket.readyState !== WebSocket.OPEN) {
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

export const sendReadReceipt = (messageIds: number[]) => {
  if (!chatSocket || chatSocket.readyState !== WebSocket.OPEN) {
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

  const socket = chatSocket;
  chatSocket = null;

  socket.close();
};
