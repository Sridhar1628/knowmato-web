// src/store/walletCache.ts

export interface WalletData {
  real: number;
  bonus: number;
  total: number;
}

export interface WalletTransaction {
  id: number;
  description: string;
  amount: number;
  real_amount?: number;
  bonus_amount?: number;
  source?: string;
  type: 'credit' | 'debit';
  date: string;
  time: string;
}

export interface WalletOffer {
  name: string;
  bonus_percentage: number;
  max_bonus: number;
}

export const walletCache = {

  wallet: {
    real: 0,
    bonus: 0,
    total: 0,
  } as WalletData,

  transactions: [] as WalletTransaction[],

  offer: null as WalletOffer | null,

  nextPage: null as string | null,

  initialized: false,
};