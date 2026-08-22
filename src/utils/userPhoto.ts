/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * The signed-in user's profile photo.
 *
 * Profile Settings uploads land on `avatar` (what the API returns), while the
 * navbars were written against the older `imagUrl` field. Reading both here
 * means a freshly uploaded photo shows up everywhere instead of only on the
 * Profile Settings card.
 */
export const getUserPhoto = (user: any): string =>
  user?.avatar || user?.imagUrl || "";
