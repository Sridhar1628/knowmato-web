let socket: WebSocket | null = null;

export const connectSocket = (
  userId: number,
  token: string,
  onMessage?: (data: any) => void
) => {
  if (socket) socket.close();

  const url = `ws://127.0.0.1:8000/ws/user/${userId}/?token=${token}`;

  socket = new WebSocket(url);

  socket.onopen = () => {
    console.log("✅ WebSocket Connected");
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("📩 WS Message:", data);

      if (onMessage) onMessage(data);
    } catch (e) {
      console.log("Parse error:", e);
    }
  };

  socket.onerror = (error) => {
    console.log("❌ WS Error:", error);
  };

  socket.onclose = () => {
    console.log("🔌 WS Disconnected");
  };
};

export const disconnectSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};

export const sendMessage = (message: any) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message)); 
  }
};