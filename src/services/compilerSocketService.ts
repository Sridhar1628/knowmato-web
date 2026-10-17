
import { WS_BASE_URL } from "../config/env";

type EventHandler = (event: string, data: any) => void;

let socket: WebSocket | null = null;

// Retained only as a connection-generation identifier.
// Never store the JWT here or include it in a WebSocket URL.
let connectionRequested = false;

let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let manualDisconnect = false;

const listeners = new Set<EventHandler>();
let messageQueue: any[] = [];

const isSocketOpen = () => socket?.readyState === WebSocket.OPEN;
const isSocketConnecting = () => socket?.readyState === WebSocket.CONNECTING;

const notifyListeners = (event: string, data: any) => {
  listeners.forEach((handler) => {
    try {
      handler(event, data);
    } catch {
      console.error("Compiler WebSocket listener error");
    }
  });
};

export const subscribeCompilerSocket = (
  handler: EventHandler
): (() => void) => {
  if (typeof handler !== "function") {
    return () => {};
  }

  listeners.add(handler);

  return () => {
    listeners.delete(handler);
  };
};

export const connectCompilerSocket = (
  _token: string,
  onEvent?: EventHandler
): (() => void) => {
  let unsubscribe = () => {};

  if (onEvent) {
    unsubscribe = subscribeCompilerSocket(onEvent);
  }

  connectionRequested = true;
  manualDisconnect = false;

  if (socket && (isSocketOpen() || isSocketConnecting())) {
    return unsubscribe;
  }

  if (socket) {
    const previousSocket = socket;
    socket = null;

    try {
      previousSocket.close();
    } catch {
      console.error("Unable to close previous compiler WebSocket");
    }
  }

  const baseUrl = WS_BASE_URL.replace(/\/+$/, "");
  const url = `${baseUrl}/ws/compiler/`;

  const ws = new WebSocket(url);
  socket = ws;

  ws.onopen = () => {
    if (socket !== ws) return;

    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    if (messageQueue.length > 0) {
      const queuedMessages = [...messageQueue];
      messageQueue = [];

      for (let index = 0; index < queuedMessages.length; index++) {
        try {
          ws.send(JSON.stringify(queuedMessages[index]));
        } catch {
          messageQueue.unshift(...queuedMessages.slice(index));
          break;
        }
      }
    }
  };

  ws.onmessage = (event) => {
    if (socket !== ws) return;

    try {
      const parsed = JSON.parse(event.data);
      const eventName = parsed?.event;

      if (typeof eventName !== "string" || !eventName) {
        return;
      }

      notifyListeners(eventName, parsed?.data);
    } catch {
      console.error("Unable to parse compiler WebSocket message");
    }
  };

  ws.onerror = () => {
    if (socket !== ws) return;

    console.error("Compiler WebSocket connection error");
  };

  ws.onclose = () => {
    if (socket !== ws) return;

    socket = null;

    if (manualDisconnect || !connectionRequested) {
      return;
    }

    if (reconnectTimeout) return;

    reconnectTimeout = setTimeout(() => {
      reconnectTimeout = null;

      if (!manualDisconnect && connectionRequested) {
        // Reconnect using the authenticated browser session cookie.
        connectCompilerSocket("");
      }
    }, 3000);
  };

  return unsubscribe;
};

export const disconnectCompilerSocket = () => {
  manualDisconnect = true;
  connectionRequested = false;

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  messageQueue = [];

  const currentSocket = socket;
  socket = null;

  if (currentSocket) {
    try {
      currentSocket.close();
    } catch {
      console.error("Unable to close compiler WebSocket");
    }
  }

  listeners.clear();
};

export const sendCompilerMessage = (message: any) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    try {
      socket.send(JSON.stringify(message));
    } catch {
      messageQueue.push(message);
    }

    return;
  }

  messageQueue.push(message);

  if (
    socket?.readyState === WebSocket.CONNECTING ||
    manualDisconnect ||
    !connectionRequested
  ) {
    return;
  }

  connectCompilerSocket("");
};

export const isCompilerSocketConnected = (): boolean => {
  return socket?.readyState === WebSocket.OPEN;
};

export const isCompilerSocketConnecting = (): boolean => {
  return socket?.readyState === WebSocket.CONNECTING;
};

export const getCompilerSocketState = () => {
  if (!socket) return "DISCONNECTED";

  switch (socket.readyState) {
    case WebSocket.CONNECTING:
      return "CONNECTING";
    case WebSocket.OPEN:
      return "CONNECTED";
    case WebSocket.CLOSING:
      return "CLOSING";
    case WebSocket.CLOSED:
      return "CLOSED";
    default:
      return "UNKNOWN";
  }
};
