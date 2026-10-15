export type PaymentStatus = "Lunas" | "DP" | "Belum Bayar";

export type VisaStatus = "Approved" | "Process" | "Pending" | "Rejected";

export type DocumentStatus = "Lengkap" | "Belum Lengkap" | "Diverifikasi";

export type TaskStatus = "Pending" | "In Progress" | "Completed";

export type TaskPriority = "High" | "Medium" | "Low";

export interface PaginationParams {
  page: number;
  pageSize: number;
  total: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
