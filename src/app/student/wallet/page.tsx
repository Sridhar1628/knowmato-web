"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { getTransactionHistory, getAvailableWalletOffers } from "@/services/v1Service";
import { connectSocket, disconnectSocket } from "@/services/versionSocketService";
import { getTokens } from "@/services/storageService";
import { apiGet } from "@/services/versionApiService";
import styles from "./Wallet.module.css";

import {
  walletCache
} from '@/store/walletCache';

import {
  subscribeWallet,
  updateWalletBalance,
  addTransaction
} from '@/store/walletRealtime';

/* ---------- Types ---------- */
interface Wallet {
  real: number;
  bonus: number;
  total: number;
}

interface Transaction {
  id: number;
  description: string;
  amount: number;
  real_amount?: number;
  bonus_amount?: number;
  source?: string;
  type: "credit" | "debit";
  date: string;
  time: string;
}

interface Offer {
  name: string;
  bonus_percentage: number;
  max_bonus: number;
}

const StudentWalletScreen = () => {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);

  // State
  const [, forceUpdate] = useState({});
  const [loading, setLoading] = useState(true);
  const [highlightTxId, setHighlightTxId] = useState<number | null>(null);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Animation for balance change (simple CSS transition)
  const prevTotalRef = useRef(walletCache.wallet.total);
  const balanceRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {

    const unsubscribe =
      subscribeWallet(() => {

        forceUpdate({});

      });

    return unsubscribe;

  }, []);

  // ---------------------------------------------------------------------------
  // Fetch data (wallet, transactions, offers)
  // ---------------------------------------------------------------------------
  const fetchData = useCallback(async () => {
    try {
      const res = await getTransactionHistory();
      const data = res.results;

      const offerRes =
        await getAvailableWalletOffers();

      const mapped = data.transactions.map((tx: any) => ({
        id: tx.id,
        description: tx.description,
        amount: tx.amount,
        real_amount: tx.real_amount,
        bonus_amount: tx.bonus_amount,
        source: tx.source,
        type: tx.type,
        date: tx.date,
        time: tx.time,
      }));

      setNextPage(res.next || null);

      walletCache.wallet = {
        real: data.wallet.real_balance,
        bonus: data.wallet.bonus_balance,
        total: data.wallet.total_balance,
      };

      walletCache.transactions = mapped;

      walletCache.offer =
        offerRes.data?.[0] || null;

      walletCache.nextPage =
        res.next || null;

      walletCache.initialized = true;

    } catch (err) {
      console.log("Wallet Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more transactions (pagination)
  const loadMoreTransactions = async () => {
    if (!nextPage || loadingMore) return;
    try {
      setLoadingMore(true);
      const res = await apiGet(nextPage);
      const data = res.results;
      const mapped = data.transactions.map((tx: any) => ({
        id: tx.id,
        description: tx.description,
        amount: tx.amount,
        real_amount: tx.real_amount,
        bonus_amount: tx.bonus_amount,
        source: tx.source,
        type: tx.type,
        date: tx.date,
        time: tx.time,
      }));
      walletCache.transactions = [...walletCache.transactions, ...mapped];
      setNextPage(res.next || null);
    } catch (err) {
      console.log("Load More Error:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Socket connection for real‑time wallet updates
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let mounted = true;
    const initSocket = async () => {
      const tokens = await getTokens();
      if (!tokens?.access) return;

      connectSocket(tokens.access, (event, data) => {
        if (!mounted) return;
        console.log("💰 WALLET WS EVENT:", event, data);

        switch (event) {
          case "WALLET_UPDATE":
            const newTotal = (data.real_balance || 0) + (data.bonus_balance || 0);
            walletCache.wallet = {
              real: data.real_balance || 0,
              bonus: data.bonus_balance || 0,
              total: newTotal,
            };
            break;

          case "TRANSACTION_CREATED":
            const newTx: Transaction = {
              id: data.id,
              description: data.description,
              amount: data.amount,
              type: data.transaction_type || data.type,
              date: data.date,
              time: data.time,
            };
            walletCache.transactions = [newTx, ...walletCache.transactions];
            setHighlightTxId(data.id);
            setTimeout(() => setHighlightTxId(null), 2000);
            break;
        }
      });
    };

    initSocket();
    return () => {
      mounted = false;
      disconnectSocket();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Initial fetch
  // ---------------------------------------------------------------------------
  useEffect(() => {

    if (
      walletCache.initialized
    ) {

      setLoading(false);

      return;
    }

    fetchData();

  }, [fetchData]);

  // ---------------------------------------------------------------------------
  // Animate balance change on total update
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (balanceRef.current && prevTotalRef.current !== walletCache.wallet.total) {
      balanceRef.current.style.transition = "none";
      balanceRef.current.style.transform = "scale(1.1)";
      setTimeout(() => {
        if (balanceRef.current) {
          balanceRef.current.style.transition = "transform 0.3s ease-out";
          balanceRef.current.style.transform = "scale(1)";
        }
      }, 50);
    }
    prevTotalRef.current = walletCache.wallet.total;
  }, [walletCache.wallet.total]);

  // ---------------------------------------------------------------------------
  // Refresh handler
  // ---------------------------------------------------------------------------
  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const renderTransaction = (tx: Transaction) => {
    const isCredit = tx.type === "credit";
    return (
      <div
        key={tx.id}
        className={`${styles.txItem} ${highlightTxId === tx.id ? styles.highlightTx : ""}`}
      >
        <div className={styles.txLeft}>
          <div
            className={styles.txIcon}
            style={{
              backgroundColor: isCredit ? "#DCFCE7" : "#FEE2E2",
            }}
          >
            <span>{isCredit ? "⬇️" : "⬆️"}</span>
          </div>
          <div className={styles.txContent}>
            <p className={styles.txTitle}>{tx.description}</p>
            <span className={styles.sourceBadge}>
              {tx.source === "wallet_topup" ? "💰 Wallet Topup" : "📚 Doubt Payment"}
            </span>
            <div className={styles.splitRow}>
              <span className={styles.splitText}>
                Main: ₹{(tx.real_amount || 0).toFixed(2)}
              </span>
              {tx.bonus_amount && tx.bonus_amount > 0 && (
                <span className={styles.bonusSplit}>
                  Bonus: ₹{tx.bonus_amount.toFixed(2)}
                </span>
              )}
            </div>
            <span className={styles.txDate}>
              {tx.date} • {tx.time}
            </span>
          </div>
        </div>
        <div className={styles.txAmountWrapper}>
          <span
            className={styles.txAmount}
            style={{ color: isCredit ? "#16A34A" : "#DC2626" }}
          >
            {isCredit ? "+" : "-"} ₹{Math.abs(tx.amount).toFixed(2)}
          </span>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className={styles.center}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------
  return (
    <div className={styles.container}>
      {/* Header */}

      <div className={styles.scrollContainer}>
        {/* Balance Card */}
        <div className={styles.balanceCard}>
          <p className={styles.balanceLabel}>
            Total Balance
          </p>

          <h2
            ref={balanceRef}
            className={styles.balanceAmount}
          >
            ₹{walletCache.wallet.total.toFixed(2)}
          </h2>

          <button
            className={styles.addMoneyBtn}
            onClick={() =>
              router.push("/add-money")
            }
          >
            + Add Money
          </button>

          {walletCache.offer && (
            <div className={styles.offerPill}>
              🎁 {walletCache.offer.bonus_percentage}% Bonus
              · Max ₹{walletCache.offer.max_bonus}
            </div>
          )}

        </div>

        {/* Split Balances */}
        <div className={styles.balanceRow}>
          <div className={styles.balanceBox}>
            <span className={styles.boxTitle}>💵 Available Balance</span>
            <span className={styles.boxAmount}>
              ₹{walletCache.wallet.real.toFixed(2)}
            </span>
          </div>
          <div className={styles.balanceBox}>
            <span className={styles.boxHint}>🎁 Bonus Balance</span>
            <span className={styles.boxAmount}>
              ₹{walletCache.wallet.bonus.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <h3 className={styles.sectionTitle}>Quick Actions</h3>
        <div className={styles.quickRow}>
          <button
            className={styles.quickItem}
            onClick={() => router.push("/add-money")}
          >
            <span>💰</span>
            <span className={styles.quickText}>Add Money</span>
          </button>
          <button
            className={styles.quickItem}
            onClick={() => router.push("/transactions")}
          >
            <span>📜</span>
            <span className={styles.quickText}>History</span>
          </button>
        </div>


        {/* Transactions Header */}
        <div className={styles.txHeader}>
          <h4 className={styles.txHeaderText}>Recent Transactions</h4>
          <button className={styles.refreshBtn} onClick={handleRefresh}>
            Refresh
          </button>
        </div>

        {/* Transactions List */}
        <div className={styles.txList}>
          {walletCache.transactions.map(renderTransaction)}
        </div>

        {/* Load More Button */}
        {nextPage && (
          <button
            className={styles.loadMoreBtn}
            onClick={loadMoreTransactions}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        )}
      </div>
    </div>
  );
};

export default StudentWalletScreen;