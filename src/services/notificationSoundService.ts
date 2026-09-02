"use client";

/**
 * ============================================================
 * KnowMato Web Notification Sound Service
 * ============================================================
 *
 * Web sound files:
 *
 * public/sounds/alert.mp3
 * public/sounds/chat_message.mp3
 *
 * Current scope:
 * - In-app/browser sounds only
 * - No browser notification permissions
 * - No push notifications
 * - No background notification system
 *
 * Sounds:
 * - alert.mp3         -> general platform notification
 * - chat_message.mp3  -> incoming chat message
 * ============================================================
 */

const ALERT_SOUND_PATH = "/sounds/alert.mp3";
const CHAT_SOUND_PATH = "/sounds/chat_message.mp3";

let alertAudio: HTMLAudioElement | null = null;
let chatAudio: HTMLAudioElement | null = null;

/**
 * Whether the browser audio system has been unlocked
 * through a user interaction.
 */
let audioUnlocked = false;

/**
 * Prevent multiple unlock listeners from being registered.
 */
let unlockListenersRegistered = false;

/**
 * ------------------------------------------------------------
 * Create Alert Audio
 * ------------------------------------------------------------
 */
const getAlertAudio = (): HTMLAudioElement | null => {
  if (typeof window === "undefined") {
    return null;
  }

  if (alertAudio) {
    return alertAudio;
  }

  try {
    const audio = new Audio(ALERT_SOUND_PATH);

    audio.preload = "auto";
    audio.volume = 1.0;

    alertAudio = audio;

    return alertAudio;
  } catch (error) {
    console.error(
      "❌ NotificationSoundService: failed to create alert audio",
      error,
    );

    return null;
  }
};

/**
 * ------------------------------------------------------------
 * Create Chat Audio
 * ------------------------------------------------------------
 */
const getChatAudio = (): HTMLAudioElement | null => {
  if (typeof window === "undefined") {
    return null;
  }

  if (chatAudio) {
    return chatAudio;
  }

  try {
    const audio = new Audio(CHAT_SOUND_PATH);

    audio.preload = "auto";
    audio.volume = 1.0;

    chatAudio = audio;

    return chatAudio;
  } catch (error) {
    console.error(
      "❌ NotificationSoundService: failed to create chat audio",
      error,
    );

    return null;
  }
};

/**
 * ------------------------------------------------------------
 * Play Audio Safely
 * ------------------------------------------------------------
 */
const playAudio = async (
  audio: HTMLAudioElement | null,
  name: string,
): Promise<void> => {
  if (!audio) {
    return;
  }

  try {
    audio.pause();
    audio.currentTime = 0;

    const playPromise = audio.play();

    if (playPromise !== undefined) {
      await playPromise;
    }

    console.log(
      `🔊 NotificationSoundService: ${name} sound played`,
    );
  } catch (error) {
    /**
     * Browsers can reject audio playback when the user has
     * not interacted with the page yet.
     *
     * This is expected browser behavior, so we don't allow
     * the error to break the WebSocket/message flow.
     */
    console.warn(
      `⚠️ NotificationSoundService: ${name} sound could not be played`,
      error,
    );
  }
};

/**
 * ------------------------------------------------------------
 * Play Alert Sound
 * ------------------------------------------------------------
 *
 * Used for general incoming KnowMato notifications.
 */
export const playAlertSound = async (): Promise<void> => {
  if (typeof window === "undefined") {
    return;
  }

  const audio = getAlertAudio();

  await playAudio(
    audio,
    "alert",
  );
};

/**
 * ------------------------------------------------------------
 * Play Chat Sound
 * ------------------------------------------------------------
 *
 * Used ONLY for incoming chat messages.
 */
export const playChatSound = async (): Promise<void> => {
  if (typeof window === "undefined") {
    return;
  }

  const audio = getChatAudio();

  await playAudio(
    audio,
    "chat",
  );
};

/**
 * ------------------------------------------------------------
 * Preload Notification Sounds
 * ------------------------------------------------------------
 *
 * Preloading helps reduce delay when the first notification
 * arrives.
 */
export const preloadNotificationSounds = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const alert = getAlertAudio();
    const chat = getChatAudio();

    alert?.load();
    chat?.load();

    console.log(
      "🔊 NotificationSoundService: sounds preloaded",
    );
  } catch (error) {
    console.warn(
      "⚠️ NotificationSoundService: preload failed",
      error,
    );
  }
};

/**
 * ------------------------------------------------------------
 * Unlock Browser Audio
 * ------------------------------------------------------------
 *
 * Modern browsers may block audio until the user interacts
 * with the page.
 *
 * We unlock the audio context by performing a very short,
 * silent playback after a real user interaction.
 */
export const unlockNotificationSounds = async (): Promise<void> => {
  if (typeof window === "undefined") {
    return;
  }

  if (audioUnlocked) {
    return;
  }

  try {
    const audio = getAlertAudio();

    if (!audio) {
      return;
    }

    const previousVolume = audio.volume;

    audio.volume = 0;
    audio.currentTime = 0;

    const playPromise = audio.play();

    if (playPromise !== undefined) {
      await playPromise;
    }

    audio.pause();
    audio.currentTime = 0;
    audio.volume = previousVolume;

    audioUnlocked = true;

    console.log(
      "🔓 NotificationSoundService: browser audio unlocked",
    );
  } catch (error) {
    /**
     * Do not mark audio as unlocked if the browser rejected
     * the playback.
     */
    console.warn(
      "⚠️ NotificationSoundService: browser audio unlock failed",
      error,
    );
  }
};

/**
 * ------------------------------------------------------------
 * Register Browser Audio Unlock
 * ------------------------------------------------------------
 *
 * Call this once from a client-side application/root component.
 */
export const registerNotificationSoundUnlock = (): (() => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  if (unlockListenersRegistered) {
    return () => {};
  }

  unlockListenersRegistered = true;

  const handleUserInteraction = () => {
    void unlockNotificationSounds();

    /**
     * Once the user has interacted with the application,
     * we no longer need these listeners.
     */
    if (audioUnlocked) {
      removeUnlockListeners();
    }
  };

  const removeUnlockListeners = () => {
    window.removeEventListener(
      "click",
      handleUserInteraction,
    );

    window.removeEventListener(
      "touchstart",
      handleUserInteraction,
    );

    window.removeEventListener(
      "keydown",
      handleUserInteraction,
    );

    window.removeEventListener(
      "pointerdown",
      handleUserInteraction,
    );

    unlockListenersRegistered = false;
  };

  window.addEventListener(
    "click",
    handleUserInteraction,
    { passive: true },
  );

  window.addEventListener(
    "touchstart",
    handleUserInteraction,
    { passive: true },
  );

  window.addEventListener(
    "keydown",
    handleUserInteraction,
    { passive: true },
  );

  window.addEventListener(
    "pointerdown",
    handleUserInteraction,
    { passive: true },
  );

  return removeUnlockListeners;
};

/**
 * ------------------------------------------------------------
 * Sound Status Helpers
 * ------------------------------------------------------------
 */
export const isNotificationSoundUnlocked = (): boolean => {
  return audioUnlocked;
};

export const isAlertSoundLoaded = (): boolean => {
  return alertAudio !== null;
};

export const isChatSoundLoaded = (): boolean => {
  return chatAudio !== null;
};

/**
 * ------------------------------------------------------------
 * Release Notification Sounds
 * ------------------------------------------------------------
 *
 * Call this only when the entire authenticated web
 * application/session is being completely torn down.
 */
export const releaseNotificationSounds = (): void => {
  try {
    if (alertAudio) {
      alertAudio.pause();
      alertAudio.currentTime = 0;
      alertAudio.src = "";
    }
  } catch (error) {
    console.warn(
      "⚠️ NotificationSoundService: alert release failed",
      error,
    );
  }

  try {
    if (chatAudio) {
      chatAudio.pause();
      chatAudio.currentTime = 0;
      chatAudio.src = "";
    }
  } catch (error) {
    console.warn(
      "⚠️ NotificationSoundService: chat release failed",
      error,
    );
  }

  alertAudio = null;
  chatAudio = null;
  audioUnlocked = false;

  console.log(
    "🔇 NotificationSoundService: all sounds released",
  );
};