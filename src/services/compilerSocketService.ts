// services/compilerSocketService.ts

import { WS_BASE_URL } from '../config/env';

let socket: WebSocket | null = null;
let currentToken: string | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
let manualDisconnect = false;

type EventHandler = (event: string, data: any) => void;
let globalHandler: EventHandler | undefined;

export const connectCompilerSocket = (
  token: string,
  onEvent: EventHandler
) => {
  if (!token) {
    console.warn('❌ Compiler WS: missing token');
    return;
  }

  if (socket && socket.readyState === WebSocket.OPEN) {
    if (currentToken === token) {
      console.log('⚠️ Compiler WS already connected with same token');
      return;
    }
    disconnectCompilerSocket();
  }

  currentToken = token;
  manualDisconnect = false;
  globalHandler = onEvent;

  const url = `${WS_BASE_URL}/ws/compiler/?token=${token}`;
  console.log('🌐 Connecting Compiler WS:', url);

  socket = new WebSocket(url);

  socket.onopen = () => {
    console.log('✅ Compiler WS connected');
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
  };

  socket.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      console.log('📩 Compiler WS event:', parsed);
      if (parsed.event && globalHandler) {
        globalHandler(parsed.event, parsed.data);
      }
    } catch (err) {
      console.error('❌ Compiler WS parse error:', err);
    }
  };

  socket.onerror = (error) => {
    console.error('❌ Compiler WS error:', error);
  };

  socket.onclose = () => {
    console.log('🔌 Compiler WS disconnected');
    socket = null;

    if (manualDisconnect) {
      console.log('🚪 Manual disconnect – no reconnect');
      return;
    }
    if (!currentToken) {
      console.log('🚫 No token – no reconnect');
      return;
    }

    reconnectTimeout = setTimeout(() => {
      console.log('🔄 Reconnecting Compiler WS...');
      connectCompilerSocket(currentToken!, globalHandler!);
    }, 3000);
  };
};

export const disconnectCompilerSocket = () => {
  console.log('🛑 Disconnecting Compiler WS');
  manualDisconnect = true;
  currentToken = null;
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (socket) {
    socket.close();
    socket = null;
  }
};

export const sendCompilerMessage = (message: any) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  } else {
    console.warn('⚠️ Compiler WS not open, cannot send:', message);
  }
};