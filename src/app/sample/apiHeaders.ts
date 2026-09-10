const NP_API_KEY = process.env.REACT_APP_NP_API_KEY || 'T3l3trelSeXAnLtxHoPTAUK7W1vqblC1zGbHnk1IJzI';

// Set once from the module root (see App.tsx) whenever the signed-in MSAL
// account changes, so every fetch call across the Network Planning Module
// can attach the bearer token without each call site (cbuApi.ts, lib/api.ts,
// and the couple of pages that call the API layer directly) having to
// thread it through explicitly.
let currentAuthToken: string | undefined;

export function setNpAuthToken(token: string | undefined): void {
  currentAuthToken = token;
}

export function getNpAuthToken(): string | undefined {
  return currentAuthToken;
}

/**
 * Pass a bearer token (an MSAL access token from acquireTokenSilent, as in
 * azureADGroupAPI.js — not an idToken, which the API rejects) to include it
 * as "Authorization: Bearer <token>", overriding the token set via
 * setNpAuthToken; omit it to use whatever the app root last set (or send no
 * Authorization header if no account is signed in yet).
 */
export function getApiHeaders(token: string | undefined = currentAuthToken): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(NP_API_KEY ? { "X-API-Key": NP_API_KEY } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
