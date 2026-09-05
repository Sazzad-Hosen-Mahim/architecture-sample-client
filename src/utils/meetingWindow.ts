/** How long after its scheduled time a meeting's JOIN link stays live. */
export const JOIN_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * A meeting link is only useful around the meeting itself. One day past the
 * scheduled time the call is over, so the client's JOIN button retires instead
 * of sitting on the card forever pointing at a dead room.
 *
 * A meeting with no usable date never expires — we'd rather show a stale link
 * than hide a live one.
 */
export const isMeetingJoinExpired = (scheduledAt?: string | Date | null) => {
  if (!scheduledAt) return false;
  const time = new Date(scheduledAt).getTime();
  if (Number.isNaN(time)) return false;
  return Date.now() > time + JOIN_WINDOW_MS;
};
