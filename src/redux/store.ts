import { configureStore } from "@reduxjs/toolkit";
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "./features/auth/authSlice";
import { baseApi } from "./api/baseApi";

// Persist configs
const authPersistConfig = {
  key: "auth",
  storage,
  // whitelist: ["auth"],
  whitelist: ["user", "accessToken"],
};
// const formPersistConfig = { key: "form", storage };

// Persisted reducers
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
// const persistedFormReducer = persistReducer(formPersistConfig, formReducer);

// Configure store
export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    // form: persistedFormReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(baseApi.middleware),
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Persistor
export const persistor = persistStore(store);
