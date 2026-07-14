import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Active Mode
export type ActiveMode = 'regular' | 'knowmatoPlus';

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: any;

  language: 'en' | 'ta';

  knowmatoPlusEnabled: boolean;
  activeMode: ActiveMode;
}

const initialState: AuthState = {
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  user: null,

  language: 'ta',

  knowmatoPlusEnabled: false,
  activeMode: 'regular',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,

  reducers: {
    loginSuccess: (state, action: PayloadAction<any>) => {
      console.log('Reducer received:', action.payload);

      state.isAuthenticated = true;
      state.accessToken = action.payload.access;
      state.refreshToken = action.payload.refresh;
      state.user = action.payload.user;

      // Do not overwrite saved language

      state.knowmatoPlusEnabled =
        action.payload.user?.knowmato_plus_enabled || false;

      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'knowmato_plus_enabled',
          String(state.knowmatoPlusEnabled)
        );

        state.activeMode = 'regular';
        localStorage.setItem('active_mode', 'regular');
      }

      console.log('Reducer user:', state.user);
      console.log('Knowmato+ enabled:', state.knowmatoPlusEnabled);
    },

    logout: (state) => {
      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;

      state.language = 'ta';
      state.knowmatoPlusEnabled = false;
      state.activeMode = 'regular';

      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('knowmato_plus_enabled');
        localStorage.removeItem('active_mode');
      }
    },

    setLanguage: (
      state,
      action: PayloadAction<'en' | 'ta'>
    ) => {
      state.language = action.payload;

      if (typeof window !== 'undefined') {
        localStorage.setItem('app_language', action.payload);
      }

      console.log('Language changed:', action.payload);
    },

    loadLanguage: (
      state,
      action: PayloadAction<'en' | 'ta'>
    ) => {
      state.language = action.payload;
      console.log('Loaded language:', action.payload);
    },

    setKnowmatoPlusEnabled: (
      state,
      action: PayloadAction<boolean>
    ) => {
      state.knowmatoPlusEnabled = action.payload;

      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'knowmato_plus_enabled',
          String(action.payload)
        );
      }

      if (!action.payload) {
        state.activeMode = 'regular';

        if (typeof window !== 'undefined') {
          localStorage.setItem('active_mode', 'regular');
        }
      }

      console.log('Knowmato+ enabled:', action.payload);
    },

    loadKnowmatoPlusEnabled: (
      state,
      action: PayloadAction<boolean>
    ) => {
      state.knowmatoPlusEnabled = action.payload;
      console.log('Loaded Knowmato+ state:', action.payload);
    },

    setActiveMode: (
      state,
      action: PayloadAction<ActiveMode>
    ) => {
      if (
        action.payload === 'knowmatoPlus' &&
        !state.knowmatoPlusEnabled
      ) {
        console.warn(
          'Cannot switch to Knowmato+ because it is not enabled.'
        );
        return;
      }

      state.activeMode = action.payload;

      if (typeof window !== 'undefined') {
        localStorage.setItem('active_mode', action.payload);
      }

      console.log('Active mode:', action.payload);
    },

    loadActiveMode: (
      state,
      action: PayloadAction<ActiveMode>
    ) => {
      if (
        action.payload === 'knowmatoPlus' &&
        !state.knowmatoPlusEnabled
      ) {
        state.activeMode = 'regular';
      } else {
        state.activeMode = action.payload;
      }

      console.log('Loaded active mode:', state.activeMode);
    },
  },
});

export const {
  loginSuccess,
  logout,
  setLanguage,
  loadLanguage,
  setKnowmatoPlusEnabled,
  loadKnowmatoPlusEnabled,
  setActiveMode,
  loadActiveMode,
} = authSlice.actions;

export default authSlice.reducer;