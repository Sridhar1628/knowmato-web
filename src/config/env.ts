const LOCAL_API_HOST = "http://127.0.0.1:8000";
const PRODUCTION_API_HOST = "https://api.knowmato.in";

// Set NEXT_PUBLIC_API_BASE_URL in .env.local to select the backend.
const CONFIGURED_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL;

export const API_HOST = CONFIGURED_API_BASE_URL
  ? CONFIGURED_API_BASE_URL.replace(/\/api\/?$/, "")
  : process.env.NODE_ENV === "production"
    ? PRODUCTION_API_HOST
    : LOCAL_API_HOST;

export const BASE_URL = CONFIGURED_API_BASE_URL
  ? `${CONFIGURED_API_BASE_URL.replace(/\/+$/, "")}/`.replace(/\/api\/api\/$/, "/api/")
  : process.env.NODE_ENV === "production"
    ? `${PRODUCTION_API_HOST}/api/`
    : `${LOCAL_API_HOST}/api/`;

export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  (process.env.NODE_ENV === "production"
    ? "wss://api.knowmato.in"
    : "ws://127.0.0.1:8000");