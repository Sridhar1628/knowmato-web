import { WS_BASE_URL } from "../config/env";

type EventHandler = (event: string, data: any) => void;

let socket: WebSocket | null = null;
let connectionRequested = false;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let manualDisconnect = false;
const listeners = new Set<EventHandler>();
let messageQueue: any[] = [];

const isSocketOpen = () =>
  typeof WebSocket !== "undefined" && socket?.readyState === WebSocket.OPEN;

const isSocketConnecting = () =>
  typeof WebSocket !== "undefined" && socket?.readyState === WebSocket.CONNECTING;

const notifyListeners = (event: string, data: any) => {
  for (const handler of listeners) {
    try {
      handler(event, data);
    } catch (error) {
      console.error("[COMPILER WS] Listener failed:", error);
    }
  }
};

const buildSocketUrl = () => {
  const baseUrl = WS_BASE_URL.replace(/\/+$/, "");
  return `${baseUrl}/ws/compiler/`;
};

const flushQueue = (ws: WebSocket) => {
  while (messageQueue.length && ws.readyState === WebSocket.OPEN) {
    const message = messageQueue[0];
    try {
      ws.send(JSON.stringify(message));
      messageQueue.shift();
    } catch (error) {
      console.error("[COMPILER WS] Could not send queued message:", error);
      break;
    }
  }
};

export const subscribeCompilerSocket = (handler: EventHandler): (() => void) => {
  if (typeof handler !== "function") return () => {};
  listeners.add(handler);
  return () => listeners.delete(handler);
};

/**
 * Connects without a JWT. The browser includes eligible session cookies
 * automatically during the WebSocket handshake. The backend must support
 * session-cookie authentication for /ws/compiler/.
 */
export const connectCompilerSocket = (
  _token?: string,
  onEvent?: EventHandler,
): (() => void) => {
  const unsubscribe = onEvent ? subscribeCompilerSocket(onEvent) : () => {};

  connectionRequested = true;
  manualDisconnect = false;

  if (typeof window === "undefined" || typeof WebSocket === "undefined") {
    console.error("[COMPILER WS] WebSocket is unavailable in this environment.");
    return unsubscribe;
  }

  if (socket && (isSocketOpen() || isSocketConnecting())) {
    return unsubscribe;
  }

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (socket) {
    const previous = socket;
    socket = null;
    previous.onopen = null;
    previous.onmessage = null;
    previous.onerror = null;
    previous.onclose = null;
    try {
      previous.close();
    } catch {
      // Ignore close errors from stale sockets.
    }
  }

  const url = buildSocketUrl();
  console.info("[COMPILER WS] Connecting to", url);

  let ws: WebSocket;
  try {
    ws = new WebSocket(url);
  } catch (error) {
    console.error("[COMPILER WS] Could not create connection:", error);
    scheduleReconnect();
    return unsubscribe;
  }

  socket = ws;

  ws.onopen = () => {
    if (socket !== ws) return;
    console.info("[COMPILER WS] Connected using browser session");
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    flushQueue(ws);
    notifyListeners("connection_open", { connected: true });
  };

  ws.onmessage = (event) => {
    if (socket !== ws) return;
    try {
      const parsed = JSON.parse(event.data);
      if (typeof parsed?.event === "string" && parsed.event) {
        notifyListeners(parsed.event, parsed.data);
      } else {
        console.warn("[COMPILER WS] Ignored message without an event name.");
      }
    } catch (error) {
      console.error("[COMPILER WS] Could not parse server message:", error);
    }
  };

  ws.onerror = () => {
    if (socket !== ws) return;
    console.error("[COMPILER WS] Connection error. Check the Network > Socket handshake.");
    notifyListeners("connection_error", {
      message: "Compiler WebSocket connection failed.",
    });
  };

  ws.onclose = (event) => {
    if (socket !== ws) return;
    socket = null;
    console.warn("[COMPILER WS] Closed", {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
    });
    notifyListeners("connection_closed", {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean,
    });

    if (manualDisconnect || !connectionRequested) return;
    scheduleReconnect();
  };

  return unsubscribe;
};

const scheduleReconnect = () => {
  if (manualDisconnect || !connectionRequested || reconnectTimeout) return;

  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    if (!manualDisconnect && connectionRequested) {
      connectCompilerSocket();
    }
  }, 3000);
};

export const disconnectCompilerSocket = () => {
  manualDisconnect = true;
  connectionRequested = false;

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  messageQueue = [];
  const current = socket;
  socket = null;

  if (current) {
    current.onopen = null;
    current.onmessage = null;
    current.onerror = null;
    current.onclose = null;
    try {
      current.close();
    } catch {
      // Ignore close errors.
    }
  }

  listeners.clear();
};

export const sendCompilerMessage = (message: any) => {
  if (isSocketOpen() && socket) {
    try {
      socket.send(JSON.stringify(message));
      console.info("[COMPILER WS] Message sent:", message?.type ?? "unknown");
    } catch (error) {
      console.error("[COMPILER WS] Send failed; message queued:", error);
      messageQueue.push(message);
    }
    return;
  }

  // Queue only for a connection that is already connecting or being established.
  messageQueue.push(message);

  if (!isSocketConnecting() && !manualDisconnect) {
    connectCompilerSocket();
  }
};

export const isCompilerSocketConnected = () => isSocketOpen();
export const isCompilerSocketConnecting = () => isSocketConnecting();

export const getCompilerSocketState = () => {
  if (typeof WebSocket === "undefined") return "UNAVAILABLE";
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
