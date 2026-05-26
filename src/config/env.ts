// 👇 Your PC local IP
const LOCAL_IP = '10.37.106.211';

const DEV =
  process.env.NODE_ENV !== 'production';

// ============================================
// API BASE URL
// ============================================
export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (
    DEV
      ? `http://${LOCAL_IP}:8000/api/`
      : 'https://api.knowmato.in/api/'
  );

// ============================================
// WEBSOCKET BASE URL
// ============================================
export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  (
    DEV
      ? `ws://${LOCAL_IP}:8000`
      : 'wss://api.knowmato.in'
  );