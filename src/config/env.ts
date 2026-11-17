
const LOCAL_API_HOST = "http://127.0.0.1:8000/api";
const PRODUCTION_API_HOST = "https://api.knowmato.in";

const CONFIGURED_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL;

const NORMALIZED_API_HOST = CONFIGURED_API_BASE_URL
  ? CONFIGURED_API_BASE_URL.replace(/\/+$/, "").replace(/\/api$/, "")
  : process.env.NODE_ENV === "production"
    ? PRODUCTION_API_HOST
    : LOCAL_API_HOST;

export const API_HOST = NORMALIZED_API_HOST;

export const BASE_URL = `${NORMALIZED_API_HOST}/api/`;

export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  (NORMALIZED_API_HOST.startsWith("https://")
    ? NORMALIZED_API_HOST.replace("https://", "wss://")
    : NORMALIZED_API_HOST.replace("http://", "ws://"));
