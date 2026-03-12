/**
 * safeRedirect.js – Redirect Allowlisting (Security Hardened)
 *
 * Prevents Open Redirect attacks by ensuring that any destination URL passed
 * through query parameters or location state is a relative path within this
 * application rather than an external URL.
 *
 * Usage:
 *   import { getSafeRedirect, isSafeRedirect } from '../utils/safeRedirect';
 *
 *   // In a component:
 *   const destination = getSafeRedirect(location.search, '/');
 *   navigate(destination);
 */

/**
 * List of explicitly allowed path prefixes within this app.
 * Any path not matching these prefixes falls back to the default.
 */
const ALLOWED_PATH_PREFIXES = [
    "/",
    "/posts",
    "/events",
    "/notifications",
    "/users",
    // NOTE: /admin paths are intentionally excluded — they are already
    // protected by AdminRoute; letting a query param redirect there
    // would bypass the UX layer guard.
];

/**
 * Returns true when `url` is a safe, same-origin, allowlisted relative path.
 *
 * Rules enforced:
 *  1. Must NOT start with // (protocol-relative — treated as external by browsers)
 *  2. Must NOT contain a scheme like http:// or https://
 *  3. Must start with / (relative to this origin)
 *  4. Must match one of the ALLOWED_PATH_PREFIXES
 *  5. Must NOT include unexpected query params that could encode a second redirect
 *
 * @param {string} url
 * @returns {boolean}
 */
export function isSafeRedirect(url) {
    if (!url || typeof url !== "string") return false;

    // Block protocol-relative URLs (//evil.com/path)
    if (url.startsWith("//")) return false;

    // Block absolute URLs with any scheme (http, https, javascript, data, etc.)
    if (/^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(url)) return false;

    // Must be a relative path starting with /
    if (!url.startsWith("/")) return false;

    // Strip query string and fragment before checking prefix
    const path = url.split("?")[0].split("#")[0];

    // Check against allowlist
    const isAllowed = ALLOWED_PATH_PREFIXES.some((prefix) => {
        // Exact match or sub-path (e.g. '/posts' allows '/posts/123')
        return path === prefix || path.startsWith(prefix + "/");
    });

    return isAllowed;
}

/**
 * Reads a `?next=…` (or custom param) from a URLSearchParams / query string
 * and returns the destination only if it passes the allowlist check.
 * Falls back to `fallback` (default: '/') when the value is absent or unsafe.
 *
 * @param {string|URLSearchParams} searchOrParams - Either a raw query string
 *   like "?next=/posts" or an already-parsed URLSearchParams object.
 * @param {string} [fallback='/'] - Path to use when no safe redirect is found.
 * @param {string} [paramName='next'] - Query param name to read.
 * @returns {string}
 */
export function getSafeRedirect(
    searchOrParams,
    fallback = "/",
    paramName = "next",
) {
    const params =
        searchOrParams instanceof URLSearchParams
            ? searchOrParams
            : new URLSearchParams(searchOrParams);

    const candidate = params.get(paramName);
    return isSafeRedirect(candidate) ? candidate : fallback;
}

/**
 * Validates a redirect target coming from React Router location.state.
 * Example: location.state?.from?.pathname
 *
 * @param {string|undefined} fromPath
 * @param {string} [fallback='/']
 * @returns {string}
 */
export function getSafeStateRedirect(fromPath, fallback = "/") {
    return isSafeRedirect(fromPath) ? fromPath : fallback;
}
