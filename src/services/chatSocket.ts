let chatSocket: WebSocket | null = null;

export const connectChatSocket = (
  sessionId: number,
  token: string,
  onMessage: (data: any) => void
) => {
  if (chatSocket) {
    chatSocket.close();
  }

  const url = `wss://jeblio-mvp.onrender.com/ws/chat/${sessionId}/?token=${token}`;

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

export const sendChatMessage = (text: string) => {
  if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
    chatSocket.send(JSON.stringify({ text }));
  }
};

export const disconnectChatSocket = () => {
  if (chatSocket) {
    chatSocket.close();
    chatSocket = null;
  }
};