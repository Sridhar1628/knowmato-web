import { store } from '@/redux/store';

import {
  updateRemainingSeconds,
  setDecisionState,
} from '@/redux/slices/matchingSlice';

let timer: ReturnType<typeof setInterval> | null = null;

/**
 * Starts the global matching timer.
 * Uses matchingExpiresAt instead of decrementing
 * so the timer is always accurate.
 */
export const startMatchingTimer = () => {

  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  timer = setInterval(() => {

    const matching =
      store.getState().matching;

    if (
      !matching.isMatching ||
      !matching.matchingExpiresAt
    ) {
      stopMatchingTimer();
      return;
    }

    const now =
      Date.now();

    const expires =
      new Date(
        matching.matchingExpiresAt
      ).getTime();

    const remaining =
      Math.max(
        Math.floor(
          (expires - now) / 1000
        ),
        0
      );

    store.dispatch(
      updateRemainingSeconds(
        remaining
      )
    );

    if (remaining <= 0) {

      store.dispatch(
        setDecisionState()
      );

      stopMatchingTimer();

    }

  }, 1000);

};

/**
 * Stops only the timer.
 * Does NOT reset Redux.
 */
export const stopMatchingTimer = () => {

  if (timer) {

    clearInterval(timer);

    timer = null;

  }

};

/**
 * Prevent duplicate timers.
 */
export const isMatchingTimerRunning = () => {

  return timer !== null;

};