
// 👇 change this to your backend IP (only for local testing)
const LOCAL_IP = '10.37.106.211';



const DEV = process.env.NODE_ENV !== "production";

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000/api/";

export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  "ws://127.0.0.1:8000";