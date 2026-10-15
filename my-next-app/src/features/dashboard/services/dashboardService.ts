import { createClient } from "@/lib/supabase/client";
import type { DashboardData } from "../types/dashboard.types";

// ─── Shared Types ──────────────────────────────────────────────

export interface AdminKPIs {
  totalJamaah: number;
  jamaahGrowth: number;
  pendaftaranAktif: number;
  newRegistrations: number;
  omzetKasMasuk: number;
  revenueGrowth: number;
  sisaTagihan: number;
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface PaymentSegment {
  label: string;
  percent: number;
  count: string;
  color: string;
}

export interface OccupancyItem {
  label: string;
  terisi: number;
  total: number;
}

export interface DepartureRow {
  id: string;
  packageName: string;
  departureDate: string;
  daysUntil: number;
  airline: string;
  booked: number;
  quota: number;
  status: string;
}

export interface AdminDashboardData {
  kpis: AdminKPIs;
  trendData: ChartPoint[];
  paymentSegments: PaymentSegment[];
  occupancyItems: OccupancyItem[];
  departures: DepartureRow[];
}

export interface AgentKPIs {
  totalKomisi: number;
  komisiBulanIni: number;
  sudahDicairkan: number;
  siapKlaim: number;
  totalJamaahReferral: number;
  jamaahBaru: number;
}

export interface ReferralRow {
  id: string;
  pilgrimName: string;
  packageName: string;
  registrationDate: string;
  estimatedCommission: number;
  payoutStatus: string;
}

export interface AgentDashboardData {
  agentName: string;
  referralCode: string;
  kpis: AgentKPIs;
  trendData: ChartPoint[];
  paymentSegments: PaymentSegment[];
  referrals: ReferralRow[];
}

export interface MuthawifKPIs {
  totalJamaah: number;
  sesiSelesai: number;
  totalSesi: number;
  rataKehadiran: number;
  nextDepartureDate: string;
  nextAirline: string;
}

export interface ManasikSessionCard {
  title: string;
  sessionDate: string;
  sessionTime: string;
  location: string;
  isNext: boolean;
}

export interface AttendanceSegment {
  label: string;
  percent: number;
  count: string;
  color: string;
}

export interface JamaahBimbinganRow {
  id: string;
  name: string;
  city: string;
  phone: string;
  roomType: string;
  manasikProgress: string;
}

export interface MuthawifDashboardData {
  muthawifName: string;
  kpis: MuthawifKPIs;
  nextSession: ManasikSessionCard | null;
  attendanceSegments: AttendanceSegment[];
  jamaahList: JamaahBimbinganRow[];
}

export interface JamaahBookingInfo {
  pilgrimName: string;
  packageName: string;
  durationDays: number;
  registrationCode: string;
  daysUntilDeparture: number;
  airline: string;
  flightNumber: string;
  hotelMakkah: string;
  hotelMadinah: string;
}

export interface JamaahDocumentItem {
  name: string;
  subLabel: string;
  status: "verified" | "reviewing" | "missing";
}

export interface JamaahManasikInfo {
  title: string;
  date: string;
  location: string;
}

export interface JamaahEquipmentItem {
  name: string;
  status: "received" | "airport" | "pending";
}

export interface JamaahDashboardData {
  booking: JamaahBookingInfo | null;
  documents: JamaahDocumentItem[];
  manasik: JamaahManasikInfo | null;
  equipment: JamaahEquipmentItem[];
}

// ─── Helper Functions ──────────────────────────────────────────

function formatRp(amount: number): string {
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(2)} M`;
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(2)} Jt`;
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

// ─── Super Admin / Admin Cabang ────────────────────────────────

export async function fetchAdminDashboard(branchId?: string): Promise<AdminDashboardData> {
  const supabase = createClient();

  const [profilesRes, bookingsRes, invoicesRes, packagesRes] = await Promise.all([
    supabase.from("profiles").select("id, created_at").in("role", ["jamaah", "jamaah_umroh"]),
    supabase.from("bookings").select("id, package_id, created_at, status"),
    supabase.from("invoices").select("id, amount, paid_amount, status, created_at"),
    supabase.from("packages").select("id, name, quota, departure_date, airline, type, status"),
  ]);

  const profiles = profilesRes.data || [];
  const bookings = bookingsRes.data || [];
  const invoices = invoicesRes.data || [];
  const packages = packagesRes.data || [];

  const totalJamaah = profiles.length;
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const lastMonthProfiles = profiles.filter((p) => {
    const d = new Date(p.created_at);
    return d.getMonth() === thisMonth - 1 && d.getFullYear() === thisYear;
  }).length;
  const thisMonthProfiles = profiles.filter((p) => {
    const d = new Date(p.created_at);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;
  const jamaahGrowth = lastMonthProfiles > 0 ? Math.round(((thisMonthProfiles - lastMonthProfiles) / lastMonthProfiles) * 100) : thisMonthProfiles > 0 ? 100 : 0;

  const pendaftaranAktif = bookings.filter((b) => b.status === "confirmed" || b.status === "active").length;
  const newRegs = thisMonthProfiles;

  const totalRevenue = invoices.reduce((acc, inv) => acc + (Number(inv.paid_amount) || 0), 0);
  const lastMonthRevenue = invoices.filter((inv) => {
    const d = new Date(inv.created_at);
    return d.getMonth() === thisMonth - 1 && d.getFullYear() === thisYear;
  }).reduce((acc, inv) => acc + (Number(inv.paid_amount) || 0), 0);
  const revenueGrowth = lastMonthRevenue > 0 ? Math.round(((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : totalRevenue > 0 ? 100 : 0;

  const outstanding = invoices
    .filter((inv) => inv.status !== "paid")
    .reduce((acc, inv) => acc + (Number(inv.amount) - Number(inv.paid_amount || 0)), 0);

  // Monthly trend from profiles creation dates
  const monthlyCounts: Record<number, number> = {};
  for (let i = 5; i >= 0; i--) {
    const m = (thisMonth - i + 12) % 12;
    monthlyCounts[m] = 0;
  }
  profiles.forEach((p) => {
    const d = new Date(p.created_at);
    if (d.getFullYear() === thisYear) {
      if (monthlyCounts[d.getMonth()] !== undefined) {
        monthlyCounts[d.getMonth()]++;
      }
    }
  });
  const trendLabels: string[] = [];
  const trendValues: number[] = [];
  for (let i = 5; i >= 0; i--) {
    const m = (thisMonth - i + 12) % 12;
    trendLabels.push(MONTH_NAMES[m]);
    trendValues.push(monthlyCounts[m] || 0);
  }

  // Payment segments
  const paidCount = invoices.filter((inv) => inv.status === "paid").length;
  const partialCount = invoices.filter((inv) => inv.status === "partial").length;
  const unpaidCount = invoices.filter((inv) => inv.status === "unpaid" || !inv.status).length;
  const totalInv = Math.max(paidCount + partialCount + unpaidCount, 1);
  const paymentSegments: PaymentSegment[] = [
    { label: "Lunas", percent: Math.round((paidCount / totalInv) * 100), count: `${paidCount}`, color: "#047857" },
    { label: "Sebagian (Cicil)", percent: Math.round((partialCount / totalInv) * 100), count: `${partialCount}`, color: "#f59e0b" },
    { label: "Belum Bayar", percent: Math.round((unpaidCount / totalInv) * 100), count: `${unpaidCount}`, color: "#ef4444" },
  ];

  // Occupancy from packages
  const occupancyItems: OccupancyItem[] = packages.slice(0, 6).map((pkg: any) => {
    const quota = Number(pkg.quota) || 0;
    const booked = bookings.filter((b) => b.package_id === pkg.id).length;
    return { label: pkg.name, terisi: booked, total: quota };
  });

  // Departures
  const departures: DepartureRow[] = packages
    .filter((pkg: any) => pkg.departure_date)
    .sort((a: any, b: any) => new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime())
    .slice(0, 5)
    .map((pkg: any) => {
      const quota = Number(pkg.quota) || 0;
      const booked = bookings.filter((b) => b.package_id === pkg.id).length;
      const dUntil = daysUntil(pkg.departure_date);
      return {
        id: pkg.id,
        packageName: pkg.name,
        departureDate: pkg.departure_date?.split("T")[0] || "",
        daysUntil: dUntil,
        airline: pkg.airline || "-",
        booked,
        quota,
        status: pkg.status || "confirmed",
      };
    });

  return {
    kpis: {
      totalJamaah,
      jamaahGrowth,
      pendaftaranAktif,
      newRegistrations: newRegs,
      omzetKasMasuk: totalRevenue,
      revenueGrowth,
      sisaTagihan: outstanding,
    },
    trendData: trendLabels.map((label, i) => ({ label, value: trendValues[i] })),
    paymentSegments,
    occupancyItems,
    departures,
  };
}

// ─── Mitra Agen ────────────────────────────────────────────────

export async function fetchAgentDashboard(): Promise<AgentDashboardData> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  const { data: agentProfile } = await supabase
    .from("profiles")
    .select("full_name, agent_code")
    .eq("id", userId)
    .single();

  const agentName = agentProfile?.full_name || "Mitra Agen";
  const referralCode = agentProfile?.agent_code || `AGN-${userId?.slice(0, 6)?.toUpperCase() || "001"}`;

  const [commissionsRes, bookingsRes, invoicesRes] = await Promise.all([
    supabase.from("commissions").select("*, bookings:booking_id (*, profiles:pilgrim_id (full_name), packages:package_id (name))").eq("agent_id", userId),
    supabase.from("bookings").select("*, profiles:pilgrim_id (full_name, created_at), packages:package_id (name)").eq("agent_id", userId),
    supabase.from("invoices").select("*"),
  ]);

  const commissions = commissionsRes.data || [];
  const agentBookings = bookingsRes.data || [];

  const totalKomisi = commissions.reduce((acc, c: any) => acc + (Number(c.amount) || 0), 0);
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const komisiBulanIni = commissions
    .filter((c: any) => {
      const d = new Date(c.created_at);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    })
    .reduce((acc, c: any) => acc + (Number(c.amount) || 0), 0);

  const sudahDicairkan = commissions
    .filter((c: any) => c.status === "paid")
    .reduce((acc, c: any) => acc + (Number(c.amount) || 0), 0);
  const siapKlaim = commissions
    .filter((c: any) => c.status === "approved" || c.status === "pending")
    .reduce((acc, c: any) => acc + (Number(c.amount) || 0), 0);

  const totalJamaahReferral = agentBookings.length;
  const jamaahBaru = agentBookings.filter((b: any) => {
    const d = new Date(b.created_at);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  // Monthly commission trend
  const monthlyComm: Record<number, number> = {};
  for (let i = 4; i >= 0; i--) {
    const m = (thisMonth - i + 12) % 12;
    monthlyComm[m] = 0;
  }
  commissions.forEach((c: any) => {
    const d = new Date(c.created_at);
    if (d.getFullYear() === thisYear && monthlyComm[d.getMonth()] !== undefined) {
      monthlyComm[d.getMonth()] += Number(c.amount) || 0;
    }
  });
  const trendLabels: string[] = [];
  const trendValues: number[] = [];
  for (let i = 4; i >= 0; i--) {
    const m = (thisMonth - i + 12) % 12;
    trendLabels.push(MONTH_NAMES[m]);
    trendValues.push(monthlyComm[m] || 0);
  }

  // Payment segments from agent's bookings' invoices
  const agentInvoiceIds = new Set(agentBookings.map((b: any) => b.id));
  const relevantInvoices = (invoicesRes.data || []).filter((inv: any) => agentInvoiceIds.has(inv.booking_id));
  const paidCount = relevantInvoices.filter((inv: any) => inv.status === "paid").length;
  const partialCount = relevantInvoices.filter((inv: any) => inv.status === "partial").length;
  const unpaidCount = relevantInvoices.filter((inv: any) => inv.status === "unpaid" || !inv.status).length;
  const totalRel = Math.max(paidCount + partialCount + unpaidCount, 1);
  const paymentSegments: PaymentSegment[] = [
    { label: "Lunas", percent: Math.round((paidCount / totalRel) * 100), count: `${paidCount} Jamaah`, color: "#059669" },
    { label: "Cicilan Berjalan", percent: Math.round((partialCount / totalRel) * 100), count: `${partialCount} Jamaah`, color: "#d97706" },
    { label: "Belum Bayar", percent: Math.round((unpaidCount / totalRel) * 100), count: `${unpaidCount} Jamaah`, color: "#ef4444" },
  ];

  // Recent referrals
  const referrals: ReferralRow[] = agentBookings.slice(0, 10).map((b: any) => {
    const commRecord = commissions.find((c: any) => c.booking_id === b.id);
    let payoutStatus = "Menunggu";
    if (commRecord?.status === "paid") payoutStatus = "Lunas (Komisi Cair)";
    else if (commRecord?.status === "approved") payoutStatus = "Lunas (Siap Klaim)";
    else if (commRecord?.status === "pending") payoutStatus = "DP Masuk (Komisi Menunggu)";

    return {
      id: b.id,
      pilgrimName: b.profiles?.full_name || "Jamaah",
      packageName: b.packages?.name || "Paket Umroh",
      registrationDate: b.created_at?.split("T")[0] || "",
      estimatedCommission: Number(commRecord?.amount) || 0,
      payoutStatus,
    };
  });

  return {
    agentName,
    referralCode,
    kpis: { totalKomisi, komisiBulanIni, sudahDicairkan, siapKlaim, totalJamaahReferral, jamaahBaru },
    trendData: trendLabels.map((label, i) => ({ label, value: trendValues[i] })),
    paymentSegments,
    referrals,
  };
}

// ─── Muthawif ──────────────────────────────────────────────────

export async function fetchMuthawifDashboard(): Promise<MuthawifDashboardData> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();

  const muthawifName = profile?.full_name || "Muthawif";

  const [sessionsRes, attendanceRes, bookingsRes, packagesRes] = await Promise.all([
    supabase.from("manasik_sessions").select("*").eq("muthawif_id", userId).order("session_date", { ascending: true }),
    supabase.from("manasik_attendance").select("*"),
    supabase.from("bookings").select("*, profiles:pilgrim_id (full_name, phone, city)").eq("guide_id", userId),
    supabase.from("packages").select("departure_date, airline").order("departure_date", { ascending: true }).limit(1),
  ]);

  const sessions = sessionsRes.data || [];
  const allAttendance = attendanceRes.data || [];
  const guideBookings = bookingsRes.data || [];
  const nextPkg = packagesRes.data?.[0];

  const totalJamaah = guideBookings.length || allAttendance.filter((a: any) => a.pilgrim_id).length || 0;
  const completedSessions = sessions.filter((s: any) => new Date(s.session_date) < new Date()).length;
  const totalSesi = sessions.length;

  // Attendance stats from latest session
  const latestSession = sessions[sessions.length - 1];
  const latestAttendance = latestSession ? allAttendance.filter((a: any) => a.session_id === latestSession.id) : [];
  const hadirCount = latestAttendance.filter((a: any) => a.status === "Hadir").length;
  const totalAtt = Math.max(latestAttendance.length, 1);
  const rataKehadiran = Math.round((hadirCount / totalAtt) * 100);

  const nextDepartureDate = nextPkg?.departure_date?.split("T")[0] || "-";
  const nextAirline = nextPkg?.airline || "-";

  // Next upcoming session
  const upcomingSession = sessions.find((s: any) => new Date(s.session_date) >= new Date());
  const nextSession: ManasikSessionCard | null = upcomingSession
    ? {
        title: upcomingSession.title || "Sesi Manasik",
        sessionDate: upcomingSession.session_date?.split("T")[0] || "",
        sessionTime: upcomingSession.session_time || "",
        location: upcomingSession.location || "",
        isNext: true,
      }
    : null;

  // Attendance donut segments
  const izinCount = latestAttendance.filter((a: any) => a.status === "Izin").length;
  const sakitCount = latestAttendance.filter((a: any) => a.status === "Sakit").length;
  const alpaCount = latestAttendance.filter((a: any) => a.status === "Alpa").length;
  const attendanceSegments: AttendanceSegment[] = [
    { label: "Hadir", percent: Math.round((hadirCount / totalAtt) * 100), count: `${hadirCount}`, color: "#059669" },
    { label: "Izin", percent: Math.round((izinCount / totalAtt) * 100), count: `${izinCount}`, color: "#d97706" },
    { label: "Sakit", percent: Math.round((sakitCount / totalAtt) * 100), count: `${sakitCount}`, color: "#3b82f6" },
    { label: "Alpa", percent: Math.round((alpaCount / totalAtt) * 100), count: `${alpaCount}`, color: "#ef4444" },
  ];

  // Jamaah list from bookings
  const jamaahList: JamaahBimbinganRow[] = guideBookings.slice(0, 10).map((b: any) => {
    const pilgrimAttendance = allAttendance.filter((a: any) => a.pilgrim_id === b.pilgrim_id && a.status === "Hadir");
    const progress = `${pilgrimAttendance.length}/${totalSesi || 1} Selesai`;
    return {
      id: b.id,
      name: b.profiles?.full_name || "Jamaah",
      city: b.profiles?.city || "-",
      phone: b.profiles?.phone || "-",
      roomType: b.room_type || "-",
      manasikProgress: progress,
    };
  });

  return {
    muthawifName,
    kpis: { totalJamaah, sesiSelesai: completedSessions, totalSesi, rataKehadiran, nextDepartureDate, nextAirline },
    nextSession,
    attendanceSegments,
    jamaahList,
  };
}

// ─── Jamaah ────────────────────────────────────────────────────

export async function fetchJamaahDashboard(): Promise<JamaahDashboardData> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  const [profileRes, bookingRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase
      .from("bookings")
      .select("*, packages:package_id (*)")
      .eq("pilgrim_id", userId)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const profile = profileRes.data;
  const booking = bookingRes.data?.[0] as any;
  const pkg = booking?.packages;

  let bookingInfo: JamaahBookingInfo | null = null;
  if (booking && pkg) {
    const depDate = pkg.departure_date || "";
    bookingInfo = {
      pilgrimName: profile?.full_name || profile?.email || "Jamaah",
      packageName: pkg.name || "Paket Umroh",
      durationDays: pkg.duration_days || 9,
      registrationCode: booking.booking_number || `REG-${new Date().getFullYear()}-001`,
      daysUntilDeparture: depDate ? daysUntil(depDate) : 0,
      airline: pkg.airline || "-",
      flightNumber: pkg.flight_number || "-",
      hotelMakkah: pkg.hotel_makkah || "-",
      hotelMadinah: pkg.hotel_madinah || "-",
    };
  }

  // Documents
  const { data: docs } = await supabase
    .from("documents")
    .select("*")
    .eq("pilgrim_id", userId);

  const docMap: Record<string, any> = {};
  (docs || []).forEach((d: any) => {
    docMap[d.document_type] = d;
  });

  const requiredDocs = [
    { key: "ktp", name: "Kartu Tanda Penduduk (KTP)", subLabel: "Dokumen Wajib" },
    { key: "kk", name: "Kartu Keluarga (KK)", subLabel: "Dokumen Wajib" },
    { key: "passport", name: "Buku Paspor Asli", subLabel: "Dokumen Wajib" },
    { key: "vaccine", name: "Buku Kuning / Sertifikat Vaksin Meningitis", subLabel: "Dokumen Wajib" },
  ];

  const documents: JamaahDocumentItem[] = requiredDocs.map((rd) => {
    const doc = docMap[rd.key];
    let status: "verified" | "reviewing" | "missing" = "missing";
    if (doc?.status === "approved" || doc?.status === "verified") status = "verified";
    else if (doc?.status === "pending" || doc?.status === "reviewing") status = "reviewing";
    return { name: rd.name, subLabel: rd.subLabel, status };
  });

  // Manasik
  const { data: sessions } = await supabase
    .from("manasik_sessions")
    .select("*")
    .gte("session_date", new Date().toISOString().split("T")[0])
    .order("session_date", { ascending: true })
    .limit(1);

  const nextManasik = sessions?.[0];
  const manasik: JamaahManasikInfo | null = nextManasik
    ? {
        title: nextManasik.title || "Bimbingan Manasik",
        date: nextManasik.session_date ? new Date(nextManasik.session_date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short", year: "numeric" }) : "-",
        location: nextManasik.location || "-",
      }
    : null;

  // Equipment
  const { data: equip } = await supabase
    .from("equipment_assignments")
    .select("*")
    .eq("pilgrim_id", userId);

  const defaultEquipment: JamaahEquipmentItem[] = [
    { name: "Koper Bagasi 24 Inch", status: "received" },
    { name: "Kain Ihram / Mukena", status: "received" },
    { name: "Buku Doa & Panduan", status: "received" },
    { name: "ID Card & Tali Gelang", status: "airport" },
  ];

  const equipment: JamaahEquipmentItem[] = (equip && equip.length > 0)
    ? equip.map((e: any) => ({
        name: e.equipment_name || e.item_name || "Perlengkapan",
        status: e.status === "distributed" ? "received" as const : e.status === "airport" ? "airport" as const : "pending" as const,
      }))
    : defaultEquipment;

  return { booking: bookingInfo, documents, manasik, equipment };
}

// ─── Legacy export for useDashboard hook ──────────────────────

export async function fetchDashboardData(): Promise<DashboardData> {
  const admin = await fetchAdminDashboard();
  return {
    stats: {
      totalPilgrims: admin.kpis.totalJamaah,
      activePilgrimsGrowth: admin.kpis.jamaahGrowth,
      closestDepartureDays: admin.departures[0]?.daysUntil ?? 0,
      nextDepartureDate: admin.departures[0]?.departureDate ?? "-",
      nextDeparturePackage: admin.departures[0]?.packageName ?? "-",
      totalRevenue: admin.kpis.omzetKasMasuk,
      revenueGrowth: admin.kpis.revenueGrowth,
      visaIssuedCount: 0,
      visaPendingCount: 0,
      remainingQuotaSummary: admin.occupancyItems.reduce((acc, i) => acc + Math.max(0, i.total - i.terisi), 0),
    },
    packages: [],
    recentPilgrims: [],
    chartData: admin.trendData.map((d) => ({ month: d.label, jamaah: d.value, target: 0 })),
  };
}
