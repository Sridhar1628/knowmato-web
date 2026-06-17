import { WS_BASE_URL } from '../config/env';

let socket: WebSocket | null = null;

let currentToken: string | null = null;

let reconnectTimeout: NodeJS.Timeout | null = null;

let manualDisconnect = false;

type MessageHandler = (
  event: string,
  data: any
) => void;

let globalMessageHandler: MessageHandler | undefined;

export const connectSocket = async (
  token: string,
  onMessage?: MessageHandler
) => {

  if (!token) {
    console.log('❌ Missing WS token');
    return;
  }

  currentToken = token;
  manualDisconnect = false;

  if (onMessage) {
    globalMessageHandler = onMessage;
  }

  // Prevent duplicate connection
  if (
    socket &&
    (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    )
  ) {
    console.log('⚠️ WS already connected');
    return;
  }

  const url =
    `${WS_BASE_URL}/ws/doubts/?token=${token}`;

  console.log('🌐 Connecting WS:', url);

  socket = new WebSocket(url);

  socket.onopen = () => {

    console.log('✅ WS Connected');

    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
  };

  socket.onmessage = (event) => {

    try {

      const parsed = JSON.parse(event.data);

      console.log('📩 WS Event:', parsed);

      if (parsed.event) {

        globalMessageHandler?.(
          parsed.event,
          parsed.data
        );
      }

    } catch (err) {

      console.log(
        '❌ WS Parse Error:',
        err
      );

    }
  };

  socket.onerror = (error) => {

    console.log(
      '❌ WS Error:',
      error
    );

  };

  socket.onclose = () => {

    console.log(
      '🔌 WS Disconnected'
    );

    socket = null;

    // USER LOGGED OUT
    if (manualDisconnect) {

      console.log(
        '🚪 Manual disconnect - no reconnect'
      );

      return;
    }

    // NO TOKEN
    if (!currentToken) {

      console.log(
        '🚫 No token - no reconnect'
      );

      return;
    }

    // AUTO RECONNECT
    reconnectTimeout = setTimeout(() => {

      console.log(
        '🔄 Reconnecting WS...'
      );

      connectSocket(
        currentToken!,
        globalMessageHandler
      );

    }, 3000);
  };
};

export const disconnectSocket = () => {

  console.log('🛑 Disconnecting WS');

  manualDisconnect = true;

  currentToken = null;

  if (reconnectTimeout) {

    clearTimeout(
      reconnectTimeout
    );

    reconnectTimeout = null;
  }

  if (socket) {

    socket.close();

    socket = null;
  }
};