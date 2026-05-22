let chatSocket: WebSocket | null = null;

export const connectChatSocket = (
  sessionId: number,
  token: string,
  onMessage: (data: any) => void
) => {
  if (chatSocket) {
    chatSocket.close();
  }

  const url = `ws://127.0.0.1:8000/ws/chat/${sessionId}/?token=${token}`;

  chatSocket = new WebSocket(url);

  chatSocket.onopen = () => {
    console.log("💬 Chat Connected");
  };

  chatSocket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("💬 Chat Message:", data);

    onMessage(data);
  };

  chatSocket.onerror = (error) => {
    console.log("❌ Chat Error:", error);
  };

  chatSocket.onclose = () => {
    console.log("🔌 Chat Disconnected");
  };
};

export const sendChatMessage = (
  message: string | Record<string, any>
) => {
  if (
    chatSocket &&
    chatSocket.readyState === WebSocket.OPEN
  ) {
    if (typeof message === "string") {
      chatSocket.send(
        JSON.stringify({ text: message })
      );
    } else {
      chatSocket.send(
        JSON.stringify(message)
      );
    }
  }
};

export const disconnectChatSocket = () => {
  if (chatSocket) {
    chatSocket.close();
    chatSocket = null;
  }
};

// ---------------- TYPING ----------------
export const sendTypingStatus = (isTyping: boolean) => {
  if (!chatSocket || chatSocket.readyState !== WebSocket.OPEN) return;

  chatSocket.send(
    JSON.stringify({
      type: "typing",
      is_typing: isTyping,
    })
  );
};

// ---------------- READ RECEIPT ----------------
export const sendReadReceipt = (messageIds: number[]) => {
  if (!chatSocket || chatSocket.readyState !== WebSocket.OPEN) return;

  chatSocket.send(
    JSON.stringify({
      type: "read",
      message_ids: messageIds,
    })
  );
};
