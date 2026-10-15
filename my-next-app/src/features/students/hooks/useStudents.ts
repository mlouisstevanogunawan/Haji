"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Pilgrim } from "@/types/database.types";
import { StudentFiltersState, PilgrimFormData } from "../types/student.types";
import {
  getPilgrims,
  createPilgrim as apiCreatePilgrim,
  updatePilgrim as apiUpdatePilgrim,
  deletePilgrim as apiDeletePilgrim,
} from "../services/studentService";
import { useDebounce } from "@/hooks/useDebounce";

export function useStudents() {
  const [pilgrims, setPilgrims] = useState<Pilgrim[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [filters, setFilters] = useState<StudentFiltersState>({
    search: "",
    paymentStatus: "ALL",
    visaStatus: "ALL",
    packageCategory: "ALL",
  });

  // Debounced search term
  const debouncedSearch = useDebounce(filters.search, 300);

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const pageSize = 5;

  const loadPilgrims = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPilgrims();
      setPilgrims(data);
    } catch {
      setError("Gagal memuat daftar jamaah umroh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPilgrims();
  }, [loadPilgrims]);

  // Filtered dataset
  const filteredPilgrims = useMemo(() => {
    return pilgrims.filter((p) => {
      // 1. Search filter
      const term = debouncedSearch.toLowerCase().trim();
      const matchSearch =
        !term ||
        p.fullName.toLowerCase().includes(term) ||
        p.passportNumber.toLowerCase().includes(term) ||
        p.nik.toLowerCase().includes(term) ||
        p.city.toLowerCase().includes(term) ||
        p.packageName.toLowerCase().includes(term);

      // 2. Payment status
      const matchPayment =
        filters.paymentStatus === "ALL" || p.paymentStatus === filters.paymentStatus;

      // 3. Visa status
      const matchVisa =
        filters.visaStatus === "ALL" || p.visaStatus === filters.visaStatus;

      return matchSearch && matchPayment && matchVisa;
    });
  }, [pilgrims, debouncedSearch, filters.paymentStatus, filters.visaStatus]);

  // Total pages
  const totalPages = Math.ceil(filteredPilgrims.length / pageSize) || 1;

  // Current page items
  const paginatedPilgrims = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPilgrims.slice(start, start + pageSize);
  }, [filteredPilgrims, page, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.paymentStatus, filters.visaStatus]);

  // Handlers
  const addPilgrim = async (formData: PilgrimFormData) => {
    const created = await apiCreatePilgrim(formData);
    setPilgrims((prev) => [created, ...prev]);
    return created;
  };

  const editPilgrim = async (id: string, formData: PilgrimFormData) => {
    const updated = await apiUpdatePilgrim(id, formData);
    setPilgrims((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  };

  const removePilgrim = async (id: string) => {
    await apiDeletePilgrim(id);
    setPilgrims((prev) => prev.filter((p) => p.id !== id));
  };

  return {
    pilgrims: paginatedPilgrims,
    rawTotalCount: pilgrims.length,
    totalCount: filteredPilgrims.length,
    loading,
    error,
    page,
    totalPages,
    pageSize,
    filters,
    setFilters,
    setPage,
    refresh: loadPilgrims,
    addPilgrim,
    editPilgrim,
    removePilgrim,
  };
}
