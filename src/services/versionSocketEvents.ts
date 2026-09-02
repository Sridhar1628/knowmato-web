/**
 * ============================================================
 * KnowMato WebSocket Events
 * ============================================================
 *
 * These event names must match the backend WebSocket events
 * used by the KnowMato Android application.
 * ============================================================
 */

export const SocketEvents = {
  DOUBT_LIST: "DOUBT_LIST",

  NEW_DOUBT_REQUEST: "NEW_DOUBT_REQUEST",
  NEW_DIRECT_REQUEST: "NEW_DIRECT_REQUEST",
  NEW_POOL_DOUBT: "NEW_POOL_DOUBT",

  SESSION_STARTED: "SESSION_STARTED",
  SESSION_ENDED: "SESSION_ENDED",
  SESSION_EXTENDED: "SESSION_EXTENDED",

  WALLET_UPDATED: "WALLET_UPDATED",

  DIRECT_ACCEPTED: "DIRECT_ACCEPTED",
  DIRECT_REJECTED: "DIRECT_REJECTED",

  POOL_DOUBT_ACCEPTED: "POOL_DOUBT_ACCEPTED",
} as const;

/**
 * ============================================================
 * Events that should play the general notification sound.
 * ============================================================
 *
 * 🔔 alert.mp3
 */
export const SOUND_NOTIFICATION_EVENTS =
  new Set<string>([
    SocketEvents.NEW_DOUBT_REQUEST,
    SocketEvents.NEW_DIRECT_REQUEST,
    SocketEvents.NEW_POOL_DOUBT,

    SocketEvents.SESSION_STARTED,
    SocketEvents.SESSION_ENDED,
    SocketEvents.SESSION_EXTENDED,

    SocketEvents.DIRECT_ACCEPTED,
    SocketEvents.DIRECT_REJECTED,

    SocketEvents.POOL_DOUBT_ACCEPTED,
  ]);