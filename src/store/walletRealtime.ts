// src/store/walletRealtime.ts

import { walletCache } from './walletCache';

type Listener = () => void;

const listeners = new Set<Listener>();

export const subscribeWallet = (
  listener: Listener
) => {

  listeners.add(listener);

  return (): void => {
    listeners.delete(listener);
  };
};

export const notifyWallet = () => {

  listeners.forEach(
    listener => listener()
  );
};

export const updateWalletBalance = (
  real: number,
  bonus: number
) => {

  walletCache.wallet = {
    real,
    bonus,
    total: real + bonus,
  };

  notifyWallet();
};

export const addTransaction = (
  transaction: any
) => {

  walletCache.transactions = [

    transaction,

    ...walletCache.transactions,

  ];

  notifyWallet();
};