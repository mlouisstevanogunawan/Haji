export type { PaymentStatus, VisaStatus, DocumentStatus, TaskStatus, TaskPriority } from "./common.types";
import { PaymentStatus, VisaStatus, DocumentStatus, TaskStatus, TaskPriority } from "./common.types";
export * from "./database";

export interface PackageItem {
  id: string;
  name: string;
  slug: string;
  category: "Reguler" | "Ramadhan" | "Haji Khusus" | "VIP";
  price: number;
  departureDate: string;
  returnDate: string;
  durationDays: number;
  airline: string;
  airlineCode?: string;
  hotelMakkah: string;
  hotelMakkahDist: string;
  hotelMadinah: string;
  hotelMadinahDist: string;
  totalQuota: number;
  availableSeats: number;
  bookedSeats: number;
  description: string;
  features: string[];
  imageUrl: string;
}

export interface Pilgrim {
  id: string;
  fullName: string;
  passportNumber: string;
  nik: string;
  gender: "Laki-laki" | "Perempuan";
  phone: string;
  email: string;
  city: string;
  packageId: string;
  packageName: string;
  departureDate: string;
  paymentStatus: PaymentStatus;
  totalPaid: number;
  remainingAmount: number;
  visaStatus: VisaStatus;
  documentStatus: DocumentStatus;
  registrationDate: string;
  notes?: string;
}

export interface OperationalTask {
  id: string;
  title: string;
  description: string;
  category: "Dokumen" | "Visa" | "Manasik" | "Akomodasi" | "Penerbangan" | "Operasional";
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  assignee: string;
  assigneeRole: string;
  relatedPackage?: string;
  completedAt?: string;
  checklistItems: {
    id: string;
    label: string;
    completed: boolean;
  }[];
}

export interface ReportTransaction {
  id: string;
  transactionNumber: string;
  pilgrimName: string;
  passportNumber: string;
  packageName: string;
  packageCategory: string;
  amount: number;
  paymentType: "DP" | "Pelunasan" | "Full Payment";
  paymentMethod: "Transfer Bank BCA" | "Transfer Mandiri" | "BSI Virtual Account" | "Cash";
  status: "Berhasil" | "Pending" | "Gagal";
  transactionDate: string;
}

export interface DashboardStats {
  totalPilgrims: number;
  activePilgrimsGrowth: number;
  closestDepartureDays: number;
  nextDepartureDate: string;
  nextDeparturePackage: string;
  totalRevenue: number;
  revenueGrowth: number;
  visaIssuedCount: number;
  visaPendingCount: number;
  remainingQuotaSummary: number;
}
