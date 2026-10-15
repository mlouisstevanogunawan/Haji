import { ReportTransaction } from "@/types/database.types";

export interface ReportFiltersState {
  startDate: string;
  endDate: string;
  packageCategory: string;
  paymentType: string;
  search: string;
}

export interface ReportSummaryData {
  totalRevenue: number;
  totalTransactions: number;
  pilgrimsCountThisMonth: number;
  avgPaymentPerPilgrim: number;
  successfulTransactions: number;
}
