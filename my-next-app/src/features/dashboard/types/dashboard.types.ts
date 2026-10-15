import { PackageItem, Pilgrim, DashboardStats } from "@/types/database.types";

export interface DashboardData {
  stats: DashboardStats;
  packages: PackageItem[];
  recentPilgrims: Pilgrim[];
  chartData: {
    month: string;
    jamaah: number;
    target: number;
  }[];
}
