// services/compilerSocketService.ts

import { WS_BASE_URL } from '../config/env';

type EventHandler = (event: string, data: any) => void;

// ============================================================
// GLOBAL SOCKET STATE
// ============================================================

let socket: WebSocket | null = null;

let currentToken: string | null = null;

let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

let manualDisconnect = false;

// ============================================================
// MULTIPLE LISTENERS
// ============================================================
//
// IMPORTANT:
//
// Previously we had:
//
// let globalHandler: EventHandler | undefined;
//
// That meant the newest component replaced the previous listener.
//
// Now every component gets its own listener.
//
// Example:
//
// CodeCompiler       -> listener A
// Agent Result       -> listener B
// Assessment Screen  -> listener C
//
// All of them receive events from the SAME WebSocket.
//

const listeners = new Set<EventHandler>();

// ============================================================
// MESSAGE QUEUE
// ============================================================

let messageQueue: any[] = [];

// ============================================================
// SOCKET STATE HELPERS
// ============================================================

const isSocketOpen = () => {
  return socket?.readyState === WebSocket.OPEN;
};

const isSocketConnecting = () => {
  return socket?.readyState === WebSocket.CONNECTING;
};

// ============================================================
// NOTIFY ALL LISTENERS
// ============================================================

const notifyListeners = (
  event: string,
  data: any
) => {
  if (listeners.size === 0) {
    console.log(
      '⚠️ Compiler WS event received but no listeners are registered:',
      event
    );

    return;
  }

  console.log(
    `👂 Notifying ${listeners.size} Compiler WS listener(s):`,
    event
  );

  listeners.forEach((handler) => {
    try {
      handler(event, data);
    } catch (error) {
      console.error(
        '❌ Compiler WS listener error:',
        error
      );
    }
  });
};

// ============================================================
// SUBSCRIBE
// ============================================================
//
// This is the NEW recommended API.
//
// A component can subscribe to the shared compiler socket.
//
// It returns an unsubscribe function.
//
// Example:
//
// const unsubscribe = subscribeCompilerSocket(handleEvent);
//
// return () => unsubscribe();
//

export const subscribeCompilerSocket = (
  handler: EventHandler
): (() => void) => {
  if (typeof handler !== 'function') {
    console.warn(
      '⚠️ subscribeCompilerSocket called without a valid handler'
    );

    return () => {};
  }

  listeners.add(handler);

  console.log(
    `👂 Compiler WS listener added (total ${listeners.size})`
  );

  return () => {
    if (!listeners.has(handler)) {
      return;
    }

    listeners.delete(handler);

    console.log(
      `👂 Compiler WS listener removed (total ${listeners.size})`
    );
  };
};

// ============================================================
// CONNECT
// ============================================================

export const connectCompilerSocket = (
  token: string,
  onEvent?: EventHandler
): (() => void) => {
  if (!token) {
    console.warn(
      '❌ Compiler WS: missing token'
    );

    return () => {};
  }

  // ----------------------------------------------------------
  // Register listener if supplied
  // ----------------------------------------------------------

  let unsubscribe = () => {};

  if (onEvent) {
    unsubscribe = subscribeCompilerSocket(onEvent);
  }

  currentToken = token;
  manualDisconnect = false;

  // ----------------------------------------------------------
  // Already connected with same token
  // ----------------------------------------------------------

  if (
    socket &&
    socket.readyState === WebSocket.OPEN &&
    currentToken === token
  ) {
    console.log(
      '⚠️ Compiler WS already connected'
    );

    return unsubscribe;
  }

  // ----------------------------------------------------------
  // Already connecting with same token
  // ----------------------------------------------------------

  if (
    socket &&
    socket.readyState === WebSocket.CONNECTING &&
    currentToken === token
  ) {
    console.log(
      '⏳ Compiler WS connection already in progress'
    );

    return unsubscribe;
  }

  // ----------------------------------------------------------
  // Close previous socket
  // ----------------------------------------------------------

  if (socket) {
    console.log(
      '🔄 Closing previous Compiler WS'
    );

    const oldSocket = socket;

    socket = null;

    try {
      oldSocket.close();
    } catch (error) {
      console.error(
        '❌ Error closing previous Compiler WS:',
        error
      );
    }
  }

  // ----------------------------------------------------------
  // Build URL
  // ----------------------------------------------------------

  const url =
    `${WS_BASE_URL}/ws/compiler/?token=${encodeURIComponent(
      token
    )}`;

  console.log(
    '🌐 Connecting Compiler WS:',
    url
  );

  const ws = new WebSocket(url);

  // IMPORTANT:
  // Only this socket can modify global socket state.

  socket = ws;

  // ==========================================================
  // OPEN
  // ==========================================================

  ws.onopen = () => {
    // Ignore stale socket
    if (socket !== ws) {
      console.log(
        '⚠️ Ignoring stale Compiler WS open'
      );

      return;
    }

    console.log(
      '✅ Compiler WS connected'
    );

    // Clear reconnect timer
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    // --------------------------------------------------------
    // Send queued messages
    // --------------------------------------------------------

    if (messageQueue.length > 0) {
      console.log(
        `📤 Sending ${messageQueue.length} queued Compiler WS message(s)`
      );

      const queuedMessages = [
        ...messageQueue,
      ];

      messageQueue = [];

      for (const message of queuedMessages) {
        try {
          ws.send(
            JSON.stringify(message)
          );

          console.log(
            '📤 Queued Compiler WS message sent:',
            message
          );
        } catch (error) {
          console.error(
            '❌ Failed to send queued Compiler WS message:',
            error
          );

          // Put it back into the queue
          messageQueue.unshift(message);
        }
      }
    }
  };

  // ==========================================================
  // MESSAGE
  // ==========================================================

  ws.onmessage = (event) => {
    // Ignore stale socket
    if (socket !== ws) {
      console.log(
        '⚠️ Ignoring message from stale Compiler WS'
      );

      return;
    }

    try {
      const parsed = JSON.parse(
        event.data
      );

      console.log(
        '📩 RAW Compiler WS:',
        parsed
      );

      const eventName =
        parsed?.event;

      const data =
        parsed?.data;

      if (!eventName) {
        console.warn(
          '⚠️ Compiler WS message has no event:',
          parsed
        );

        return;
      }

      console.log(
        '📩 Compiler WS event:',
        {
          event: eventName,
          data,
        }
      );

      // ------------------------------------------------------
      // Broadcast to all subscribers
      // ------------------------------------------------------

      notifyListeners(
        eventName,
        data
      );
    } catch (error) {
      console.error(
        '❌ Compiler WS parse error:',
        error
      );
    }
  };

  // ==========================================================
  // ERROR
  // ==========================================================

  ws.onerror = (event) => {
    if (socket !== ws) {
      return;
    }

    console.error(
      '❌ Compiler WS error occurred:',
      event
    );
  };

  // ==========================================================
  // CLOSE
  // ==========================================================

  ws.onclose = (event) => {
    // Ignore stale socket
    if (socket !== ws) {
      console.log(
        '⚠️ Ignoring close event from stale Compiler WS'
      );

      return;
    }

    console.log(
      '🔌 Compiler WS disconnected',
      {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      }
    );

    socket = null;

    // --------------------------------------------------------
    // Manual disconnect
    // --------------------------------------------------------

    if (manualDisconnect) {
      console.log(
        '🚪 Manual disconnect – no reconnect'
      );

      return;
    }

    // --------------------------------------------------------
    // No token
    // --------------------------------------------------------

    if (!currentToken) {
      console.log(
        '🚫 No token – no reconnect'
      );

      return;
    }

    // --------------------------------------------------------
    // Already scheduled
    // --------------------------------------------------------

    if (reconnectTimeout) {
      return;
    }

    // --------------------------------------------------------
    // Reconnect
    // --------------------------------------------------------

    reconnectTimeout = setTimeout(() => {
      reconnectTimeout = null;

      if (
        !currentToken ||
        manualDisconnect
      ) {
        return;
      }

      console.log(
        '🔄 Reconnecting Compiler WS...'
      );

      connectCompilerSocket(
        currentToken
      );
    }, 3000);
  };

  return unsubscribe;
};

// ============================================================
// DISCONNECT
// ============================================================
//
// This is a REAL global disconnect.
//
// Only use this when the entire application/user session
// genuinely needs to terminate the compiler connection.
//
// Individual components should use the unsubscribe function
// returned by connectCompilerSocket() / subscribeCompilerSocket().
//
// ============================================================

export const disconnectCompilerSocket = () => {
  console.log(
    '🛑 Disconnecting Compiler WS'
  );

  manualDisconnect = true;

  currentToken = null;

  // Clear reconnect timer
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  // Don't leave old compile messages
  // after a true global disconnect.
  messageQueue = [];

  if (socket) {
    const ws = socket;

    socket = null;

    try {
      ws.close();
    } catch (error) {
      console.error(
        '❌ Error closing Compiler WS:',
        error
      );
    }
  }

  // Remove all listeners because this is
  // an intentional GLOBAL disconnect.
  listeners.clear();

  console.log(
    '👂 All Compiler WS listeners removed'
  );
};

// ============================================================
// SEND MESSAGE
// ============================================================

export const sendCompilerMessage = (
  message: any
) => {
  // ----------------------------------------------------------
  // Connected → send immediately
  // ----------------------------------------------------------

  if (
    socket &&
    socket.readyState === WebSocket.OPEN
  ) {
    try {
      socket.send(
        JSON.stringify(message)
      );

      console.log(
        '📤 Compiler WS message sent:',
        message
      );
    } catch (error) {
      console.error(
        '❌ Failed to send Compiler WS message:',
        error
      );

      // Preserve message
      messageQueue.push(message);
    }

    return;
  }

  // ----------------------------------------------------------
  // Connecting → queue
  // ----------------------------------------------------------

  if (
    socket &&
    socket.readyState === WebSocket.CONNECTING
  ) {
    console.log(
      '⏳ Compiler WS still connecting. Queueing message:',
      message
    );

    messageQueue.push(message);

    return;
  }

  // ----------------------------------------------------------
  // No active socket
  // ----------------------------------------------------------

  console.warn(
    '⚠️ Compiler WS unavailable. Queueing message:',
    message
  );

  messageQueue.push(message);

  // Reconnect if possible
  if (
    currentToken &&
    !manualDisconnect
  ) {
    console.log(
      '🔄 No active socket. Starting reconnect...'
    );

    connectCompilerSocket(
      currentToken
    );
  }
};

// ============================================================
// OPTIONAL STATUS HELPERS
// ============================================================

export const isCompilerSocketConnected = (): boolean => {
  return (
    socket?.readyState ===
    WebSocket.OPEN
  );
};

export const isCompilerSocketConnecting = (): boolean => {
  return (
    socket?.readyState ===
    WebSocket.CONNECTING
  );
};

export const getCompilerSocketState = () => {
  if (!socket) {
    return 'DISCONNECTED';
  }

  switch (socket.readyState) {
    case WebSocket.CONNECTING:
      return 'CONNECTING';

    case WebSocket.OPEN:
      return 'CONNECTED';

    case WebSocket.CLOSING:
      return 'CLOSING';

    case WebSocket.CLOSED:
      return 'CLOSED';

    default:
      return 'UNKNOWN';
  }
};