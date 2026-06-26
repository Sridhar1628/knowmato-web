import {
  transactionCache,
  Transaction,
  Summary,
  Section,
} from './transactionCache';

type Listener = () => void;

const listeners = new Set<Listener>();

// =======================================================
// Subscribe
// =======================================================

export const subscribeTransactions = (
  listener: Listener
) => {

  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };

};

// =======================================================
// Notify all pages
// =======================================================

export const notifyTransactions = () => {

  listeners.forEach(listener => listener());

};

// =======================================================
// Replace Entire Cache
// =======================================================

export const setTransactionCache = (

  transactions: Transaction[],

  sections: Section[],

  summary: Summary,

  nextPage: string | null

) => {

  transactionCache.transactions = transactions;

  transactionCache.sections = sections;

  transactionCache.summary = summary;

  transactionCache.nextPage = nextPage;

  transactionCache.initialized = true;

  notifyTransactions();

};

// =======================================================
// Add One Transaction
// =======================================================

export const addTransaction = (
  transaction: Transaction
) => {

  transactionCache.transactions = [

    transaction,

    ...transactionCache.transactions,

  ];

  notifyTransactions();

};

// =======================================================
// Update Existing Transaction
// =======================================================

export const updateTransaction = (
  transaction: Transaction
) => {

  transactionCache.transactions =
    transactionCache.transactions.map(item =>

      item.id === transaction.id

        ? transaction

        : item

    );

  notifyTransactions();

};

// =======================================================
// Clear Cache
// =======================================================

export const clearTransactionCache = () => {

  transactionCache.transactions = [];

  transactionCache.sections = [];

  transactionCache.summary = {
    added: 0,
    spent: 0,
    bonus: 0,
    net: 0,
  };

  transactionCache.nextPage = null;

  transactionCache.initialized = false;

  notifyTransactions();

};