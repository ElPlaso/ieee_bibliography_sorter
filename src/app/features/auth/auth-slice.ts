import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "firebase/auth";
import 'firebase/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
    },
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.loading = false;
      state.user = action.payload;
      state.error = null;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.user = null;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
    }
  },
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;

export default authSlice.reducer;