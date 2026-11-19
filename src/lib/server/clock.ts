import "server-only";

/** Request time for server components (they render once per request). */
export const serverNow = () => Date.now();
