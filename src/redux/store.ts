import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import matchingReducer from './slices/matchingSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    matching: matchingReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;