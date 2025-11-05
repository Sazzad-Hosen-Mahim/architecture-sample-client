import { RootState } from "@/redux/store";
import { createSlice } from "@reduxjs/toolkit";
// import { RootState } from "../../store";

export type TUser = {
  name: string;
  email: string;
  role: string;
  imagUrl?: string;
  phoneNumber?: string;
  bio?: string;
  companyName?: string;
};

type TAuthState = {
  user: null | TUser;
  accessToken: null | string;
};

const initialState: TAuthState = {
  user: null,
  accessToken: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.accessToken = token;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
    },
    // ✅ new reducer for profile update
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { setUser, logout, updateUser } = authSlice.actions;

export default authSlice.reducer;

export const selectCurrentToken = (state: RootState) => state.auth.accessToken;
export const selectCurrentUser = (state: RootState) => state.auth.user;
