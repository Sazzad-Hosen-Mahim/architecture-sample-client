/**
 * Normalises a link someone typed into an admin field so it leaves the app.
 *
 * PMs paste bare hosts — "facebook.com", "drive.google.com/drive/folders/…" —
 * and a scheme-less href is a *relative* URL, so the browser resolves it
 * against the current origin and you land on localhost:5173/facebook.com
 * instead of the site. Prefixing https:// is what makes it absolute.
 *
 * Returns null for anything unusable, so callers can render a disabled state
 * rather than a dead link.
 */
export function toExternalUrl(raw: string | null | undefined): string | null {
    if (!raw) return null;

    const url = raw.trim();
    if (!url) return null;

    // These are typed by staff but clicked by clients — never hand the browser
    // something executable, whatever ended up in the field.
    if (/^(javascript|data|vbscript|file|blob):/i.test(url)) return null;

    if (/^https?:\/\//i.test(url)) return url;

    // Protocol-relative ("//drive.google.com/…") — keep the host, force https.
    if (url.startsWith("//")) return `https:${url}`;

    return `https://${url}`;
}
