'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import api from '@/api/axiosInstance';
import { getTokens } from '@/services/storageService';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// Types
// ============================================
interface Transaction {
  id: number;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  date: string;        // "2026-04-14"
  time: string;        // "04:26:58"
  created_at: string;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: {
    message: string;
    data: Transaction[];
  };
}

type FilterType = 'all' | 'credit' | 'debit';

// ============================================
// Helper Functions
// ============================================
const formatDisplayDate = (dateStr: string, timeStr: string): string => {
  try {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + ` at ${timeStr}`;
  } catch {
    return 'Invalid date';
  }
};

// Fetch all transactions recursively (handles pagination)
const fetchAllTransactions = async (url: string, accumulated: Transaction[] = []): Promise<Transaction[]> => {
  try {
    const response = await api.get(url);
    const data: PaginatedResponse = response.data;
    const newTransactions = data.results?.data || [];
    const all = [...accumulated, ...newTransactions];
    if (data.next) {
      return fetchAllTransactions(data.next, all);
    }
    return all;
  } catch (err) {
    console.error('Error fetching paginated transactions:', err);
    throw err;
  }
};

// ============================================
// Filter Chip Component
// ============================================
const FilterChip = ({ label, value, emoji, active, onClick }: { 
  label: string; 
  value: FilterType; 
  emoji: string; 
  active: boolean; 
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${
      active
        ? 'bg-indigo-600 text-white shadow-sm'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    <span>{emoji}</span>
    <span>{label}</span>
  </button>
);

// ============================================
// Main Wallet Component
// ============================================
export default function StudentWalletPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [adding, setAdding] = useState(false);

  // Fetch wallet data (balance + all transactions)
  const fetchWalletData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      // 1. Get wallet balance from profile
      const profileRes = await api.get('/accounts/profile/');
      const walletBalance = profileRes.data?.data?.wallet_balance ?? 0;
      setBalance(walletBalance);

      // 2. Fetch all transactions (handles pagination internally)
      const allTx = await fetchAllTransactions('/wallet/transactions/');
      setTransactions(allTx);
    } catch (err: any) {
      console.error('Wallet fetch error:', err);
      setError(err?.response?.data?.error || 'Could not load wallet data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    fetchWalletData(true);
  };

  // Initial load
  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  // Filter transactions locally
  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredTransactions(transactions);
    } else {
      setFilteredTransactions(transactions.filter(tx => tx.type === activeFilter));
    }
  }, [transactions, activeFilter]);

  // WebSocket for real‑time wallet updates
  useEffect(() => {
    let socket: WebSocket | null = null;

    const connectWalletSocket = async () => {
      try {
        const tokens = await getTokens();
        if (!tokens?.access || !user?.id) return;

        socket = new WebSocket(
          `wss://jeblio-mvp.onrender.com/ws/user/${user.id}/?token=${tokens.access}`
        );

        socket.onopen = () => console.log('🔥 WALLET WS CONNECTED');
        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          handleWalletRealtime(data);
        };
        socket.onerror = (err) => console.error('❌ WALLET WS ERROR:', err);
        socket.onclose = () => console.log('🔌 WALLET WS CLOSED');
      } catch (err) {
        console.error('Wallet socket error:', err);
      }
    };

    connectWalletSocket();
    return () => {
      if (socket) socket.close();
    };
  }, [user?.id]);

  const handleWalletRealtime = (data: any) => {
    if (!data?.event) return;

    if (data.event === 'WALLET_UPDATED') {
      const newBalance = Number(data.data.balance);
      setBalance(newBalance);
    }

    if (data.event === 'TRANSACTION_CREATED') {
      const tx = data.data;
      const newTx: Transaction = {
        id: tx.id,
        amount: Number(tx.amount),
        type: tx.type,
        description: tx.description,
        date: tx.date || new Date().toISOString().split('T')[0],
        time: tx.time || new Date().toLocaleTimeString(),
        created_at: tx.created_at || new Date().toISOString(),
      };
      setTransactions(prev => [newTx, ...prev]);
    }
  };

  // Add money handler
  const handleAddMoney = async () => {
    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }
    setAdding(true);
    try {
      await api.post('/wallet/add-money/', { amount });
      alert(`₹${amount.toFixed(2)} added to your wallet.`);
      setModalOpen(false);
      setAddAmount('');
      fetchWalletData(); // refresh balance and transactions
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add money.');
    } finally {
      setAdding(false);
    }
  };

  // Loading state
  if (loading && !refreshing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="mt-3 text-gray-600">Loading wallet...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-5xl mb-3">⚠️</div>
        <p className="text-red-500 text-center mb-4">{error}</p>
        <button
          onClick={() => fetchWalletData()}
          className="rounded-full bg-indigo-600 px-5 py-2 text-white font-semibold hover:bg-indigo-700"
        >
          ⟳ Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="mx-auto max-w-3xl px-4">
        {/* Balance Card with Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-500 p-5 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-white/90 font-semibold">💰 Wallet Balance</span>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/30"
            >
              <span>➕</span>
              <span>Add Money</span>
            </button>
          </div>
          <div className="mt-2 text-4xl font-extrabold text-white">₹{balance.toFixed(2)}</div>
          <div className="mt-1 text-xs text-white/70">Use wallet to save ₹3 per session</div>
        </motion.div>

        {/* Promo Banner */}
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <span className="text-3xl">🎁</span>
          <div>
            <p className="font-semibold text-amber-800">Wallet Offer</p>
            <p className="text-sm text-amber-700">Pay with wallet & save ₹3 on every session</p>
          </div>
        </div>

        {/* Transaction Header + Filters + Refresh */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-gray-800">📜 Transaction History</h2>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : '⟳ Refresh'}
          </button>
        </div>

        {/* Filter Chips */}
        <div className="mb-5 flex flex-wrap gap-2">
          <FilterChip label="All" value="all" emoji="📋" active={activeFilter === 'all'} onClick={() => setActiveFilter('all')} />
          <FilterChip label="Credits" value="credit" emoji="💰" active={activeFilter === 'credit'} onClick={() => setActiveFilter('credit')} />
          <FilterChip label="Debits" value="debit" emoji="💸" active={activeFilter === 'debit'} onClick={() => setActiveFilter('debit')} />
        </div>

        {/* Transaction List */}
        {filteredTransactions.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="text-6xl mb-3">📭</div>
            <p className="text-lg font-semibold text-gray-700">No transactions yet</p>
            <p className="text-gray-500">
              {activeFilter === 'all'
                ? 'Add money to your wallet to see transactions here.'
                : `No ${activeFilter} transactions found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((tx) => {
              const isCredit = tx.type === 'credit';
              const amountColor = isCredit ? 'text-green-600' : 'text-red-500';
              const amountPrefix = isCredit ? '+' : '-';
              const emoji = isCredit ? '💰' : '💸';

              return (
                <div key={tx.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{emoji}</span>
                    <div>
                      <p className="font-medium text-gray-800">{tx.description}</p>
                      <p className="text-xs text-gray-400">{formatDisplayDate(tx.date, tx.time)}</p>
                    </div>
                  </div>
                  <p className={`text-lg font-bold ${amountColor}`}>
                    {amountPrefix} ₹{Math.abs(tx.amount).toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Money Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            >
              <h3 className="text-center text-2xl font-bold text-gray-800">💰 Add Money to Wallet</h3>
              <p className="mb-5 text-center text-gray-500">Enter amount (₹)</p>
              <input
                type="number"
                placeholder="e.g. 500"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                className="mb-6 w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-lg font-semibold focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-xl bg-gray-100 py-2.5 font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMoney}
                  disabled={adding}
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {adding ? 'Adding...' : 'Add & Pay'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}