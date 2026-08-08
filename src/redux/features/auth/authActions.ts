import { baseApi } from "@/redux/api/baseApi";
import { logout, setCredentials } from "./authSlice";
import type { AppDispatch } from "@/redux/store";

/**
 * Signing in or out must also wipe every cached API response.
 *
 * RTK Query's cache lives in the store and is keyed only by endpoint + args —
 * it has no concept of *who* the response belonged to. Clearing `auth` alone
 * leaves the previous account's data in the cache, and because RTK serves
 * cached data immediately on mount, the next person to sign in on this browser
 * is shown it. In practice that meant a client seeing the full admin project
 * list from `/project-requests-admin` — data the API itself would refuse them.
 *
 * Only `auth` is persisted, so a hard refresh clears the cache anyway. This
 * closes the client-side navigation path, which is the one users actually hit.
 */
export const signOut = () => (dispatch: AppDispatch) => {
  dispatch(logout());
  dispatch(baseApi.util.resetApiState());
};

/** Clear any previous account's cache before the new session populates it. */
export const signIn =
  (payload: Parameters<typeof setCredentials>[0]) => (dispatch: AppDispatch) => {
    dispatch(baseApi.util.resetApiState());
    dispatch(setCredentials(payload));
  };
