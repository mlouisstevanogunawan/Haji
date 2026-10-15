"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ReportTransaction } from "@/types/database.types";
import { ReportFiltersState, ReportSummaryData } from "../types/report.types";
import { getTransactions, createTransaction as apiCreateTransaction } from "../services/reportService";
import { calculateSummary } from "../utils/reportFormatter";
import { exportTransactionsToCSV } from "../services/reportExportService";
import { useDebounce } from "@/hooks/useDebounce";

export function useReports(filters: ReportFiltersState) {
  const [transactions, setTransactions] = useState<ReportTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(filters.search, 300);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch {
      setError("Gagal memuat rekap laporan keuangan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // 1. Search
      const term = debouncedSearch.toLowerCase().trim();
      const matchSearch =
        !term ||
        t.pilgrimName.toLowerCase().includes(term) ||
        t.transactionNumber.toLowerCase().includes(term) ||
        t.passportNumber.toLowerCase().includes(term) ||
        t.packageName.toLowerCase().includes(term);

      // 2. Date range
      let matchDate = true;
      if (filters.startDate) {
        matchDate = matchDate && t.transactionDate >= filters.startDate;
      }
      if (filters.endDate) {
        matchDate = matchDate && t.transactionDate <= filters.endDate;
      }

      // 3. Category
      const matchCategory =
        filters.packageCategory === "ALL" ||
        t.packageCategory === filters.packageCategory;

      // 4. Payment Type
      const matchType =
        filters.paymentType === "ALL" || t.paymentType === filters.paymentType;

      return matchSearch && matchDate && matchCategory && matchType;
    });
  }, [
    transactions,
    debouncedSearch,
    filters.startDate,
    filters.endDate,
    filters.packageCategory,
    filters.paymentType,
  ]);

  // Summary metrics calculated from filtered transactions
  const summary: ReportSummaryData = useMemo(() => {
    return calculateSummary(filteredTransactions);
  }, [filteredTransactions]);

  // Export CSV
  const handleExportCSV = () => {
    exportTransactionsToCSV(filteredTransactions);
  };

  const addTransaction = async (
    data: Omit<ReportTransaction, "id" | "transactionNumber">
  ) => {
    const created = await apiCreateTransaction(data);
    setTransactions((prev) => [created, ...prev]);
    return created;
  };

  return {
    transactions: filteredTransactions,
    rawCount: transactions.length,
    filteredCount: filteredTransactions.length,
    summary,
    loading,
    error,
    refresh: loadData,
    handleExportCSV,
    addTransaction,
  };
}
