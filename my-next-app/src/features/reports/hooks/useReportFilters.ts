"use client";

import { useState } from "react";
import { ReportFiltersState } from "../types/report.types";

export function useReportFilters() {
  const [filters, setFilters] = useState<ReportFiltersState>({
    startDate: "",
    endDate: "",
    packageCategory: "ALL",
    paymentType: "ALL",
    search: "",
  });

  const resetFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      packageCategory: "ALL",
      paymentType: "ALL",
      search: "",
    });
  };

  return {
    filters,
    setFilters,
    resetFilters,
  };
}
