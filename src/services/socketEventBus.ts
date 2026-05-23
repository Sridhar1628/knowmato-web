let listeners: ((event: string, data: any) => void)[] = [];

export const subscribeSocket = (callback: (event: string, data: any) => void) => {
  listeners.push(callback);

  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
};

export const emitSocketEvent = (event: string, data: any) => {
  listeners.forEach(cb => cb(event, data));
};