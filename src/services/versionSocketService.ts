
import { WS_BASE_URL } from "../config/env";

import { SOUND_NOTIFICATION_EVENTS } from "@/services/versionSocketEvents";
import { playAlertSound } from "@/services/notificationSoundService";

let socket: WebSocket | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let manualDisconnect = false;
let connectionRequested = false;

type MessageHandler = (event: string, data: any) => void;

let globalMessageHandler: MessageHandler | undefined;

export const connectSocket = async (
  _token: string,
  onMessage?: MessageHandler
) => {
  connectionRequested = true;
  manualDisconnect = false;

  if (onMessage) {
    globalMessageHandler = onMessage;
  }

  if (
    socket &&
    (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    )
  ) {
    return;
  }

  const baseUrl = WS_BASE_URL.replace(/\/+$/, "");
  const url = `${baseUrl}/ws/doubts/`;

  const ws = new WebSocket(url);
  socket = ws;

  ws.onopen = () => {
    if (socket !== ws) return;

    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
  };

  ws.onmessage = (event) => {
    if (socket !== ws) return;

    try {
      const parsed = JSON.parse(event.data);

      if (parsed?.event) {
        const eventName = String(parsed.event);

        if (SOUND_NOTIFICATION_EVENTS.has(eventName)) {
          void playAlertSound();
        }

        globalMessageHandler?.(eventName, parsed.data);
      }
    } catch {
      console.error("Unable to parse WebSocket notification");
    }
  };

  ws.onerror = () => {
    if (socket !== ws) return;
    console.error("Notification WebSocket connection error");
  };

  ws.onclose = () => {
    if (socket !== ws) return;

    socket = null;

    if (manualDisconnect || !connectionRequested) {
      return;
    }

    if (reconnectTimeout) {
      return;
    }

    reconnectTimeout = setTimeout(() => {
      reconnectTimeout = null;

      if (!manualDisconnect && connectionRequested) {
        void connectSocket("", globalMessageHandler);
      }
    }, 3000);
  };
};

export const disconnectSocket = () => {
  manualDisconnect = true;
  connectionRequested = false;

  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  const currentSocket = socket;
  socket = null;

  if (currentSocket) {
    currentSocket.close();
  }
};
