import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type MatchingStatus =
  | 'idle'
  | 'searching'
  | 'decision'
  | 'accepted'
  | 'cancelled'
  | 'completed';

export interface MatchingState {
  status: MatchingStatus;

  isMatching: boolean;

  doubtId: number | null;

  waitingRound: number;

  matchingStartedAt: string | null;

  matchingExpiresAt: string | null;

  remainingSeconds: number;
}

const initialState: MatchingState = {
  status: 'idle',

  isMatching: false,

  doubtId: null,

  waitingRound: 1,

  matchingStartedAt: null,

  matchingExpiresAt: null,

  remainingSeconds: 0,
};

const matchingSlice = createSlice({
  name: 'matching',

  initialState,

  reducers: {
    startMatching: (
      state,
      action: PayloadAction<{
        doubtId: number;
        waitingRound: number;
        matchingStartedAt: string;
        matchingExpiresAt: string;
        remainingSeconds?: number;
      }>
    ) => {
      state.status = 'searching';

      state.isMatching = true;

      state.doubtId = action.payload.doubtId;

      state.waitingRound = action.payload.waitingRound;

      state.matchingStartedAt =
        action.payload.matchingStartedAt;

      state.matchingExpiresAt =
        action.payload.matchingExpiresAt;

      state.remainingSeconds =
        action.payload.remainingSeconds ?? 0;
    },

    updateRemainingSeconds: (
      state,
      action: PayloadAction<number>
    ) => {
      state.remainingSeconds = action.payload;
    },

    setDecisionState: (state) => {
      state.status = 'decision';

      state.remainingSeconds = 0;
    },

    resumeMatching: (
      state,
      action: PayloadAction<{
        waitingRound: number;
        matchingStartedAt: string;
        matchingExpiresAt: string;
        remainingSeconds?: number;
      }>
    ) => {
      state.status = 'searching';

      state.isMatching = true;

      state.waitingRound =
        action.payload.waitingRound;

      state.matchingStartedAt =
        action.payload.matchingStartedAt;

      state.matchingExpiresAt =
        action.payload.matchingExpiresAt;

      state.remainingSeconds =
        action.payload.remainingSeconds ?? 0;
    },

    setAccepted: (state) => {
      state.status = 'accepted';
    },

    setCancelled: (state) => {
      state.status = 'cancelled';

      state.isMatching = false;
    },

    stopMatching: () => initialState,
  },
});

export const {
  startMatching,
  updateRemainingSeconds,
  setDecisionState,
  resumeMatching,
  setAccepted,
  setCancelled,
  stopMatching,
} = matchingSlice.actions;

export default matchingSlice.reducer;