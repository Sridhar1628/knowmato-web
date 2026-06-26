export interface Transaction {
  id: number;
  type: 'credit' | 'debit';
  amount: number;
  real_amount: number;
  bonus_amount: number;
  description: string;
  source: string;
  created_at: string;
  date: string;
}

export interface Summary {
  added: number;
  spent: number;
  bonus: number;
  net: number;
}

export interface Section {
  title: string;
  data: Transaction[];
}

export const transactionCache = {

  transactions: [] as Transaction[],

  sections: [] as Section[],

  summary: {
    added: 0,
    spent: 0,
    bonus: 0,
    net: 0,
  } as Summary,

  nextPage: null as string | null,

  selectedFilter: 'All',

  initialized: false,

};