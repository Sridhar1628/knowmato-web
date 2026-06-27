// 👇 Your PC local IP
const LOCAL_IP = '127.0.0.1';

const DEV = process.env.NODE_ENV !== 'production';

export const API_HOST = DEV
  ? `http://${LOCAL_IP}:8000`
  : 'https://api.knowmato.in';

export const BASE_URL = DEV
  ? 'http://127.0.0.1:8000/api/'
  : 'https://api.knowmato.in/api/';

export const WS_BASE_URL = DEV
  ? 'ws://127.0.0.1:8000'
  : 'wss://api.knowmato.in';