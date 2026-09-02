import { WS_BASE_URL } from '../config/env';

import {
  SOUND_NOTIFICATION_EVENTS,
} from '@/services/versionSocketEvents';

import {
  playAlertSound,
} from '@/services/notificationSoundService';

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
        const eventName = String(parsed.event);

        /**
         * ======================================================
         * GENERAL NOTIFICATION SOUND
         * ======================================================
         *
         * Play alert.mp3 only for the same events used by
         * the Android application.
         */
        if (
          SOUND_NOTIFICATION_EVENTS.has(eventName)
        ) {
          console.log(
            '🔔 Playing notification sound for event:',
            eventName
          );

          void playAlertSound();
        }

        /**
         * Pass the event to the existing application handler.
         */
        globalMessageHandler?.(
          eventName,
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

    if (manualDisconnect) {
      console.log(
        '🚪 Manual disconnect - no reconnect'
      );
      return;
    }

    if (!currentToken) {
      console.log(
        '🚫 No token - no reconnect'
      );
      return;
    }

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