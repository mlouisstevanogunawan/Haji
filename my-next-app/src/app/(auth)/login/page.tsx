import { Metadata } from "next";
import { LeftPanel, RightPanel } from "@/components/auth";

export const metadata: Metadata = {
  title: "Masuk ke Akun | Travel Umroh & Haji",
  description:
    "Portal masuk petugas, admin cabang, mitra agen, dan jamaah Travel Umroh & Haji.",
};

interface LoginPageProps {
  searchParams: { redirect?: string };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen w-full bg-white">
      {/* Panel Hijau Kiri (Desktop) */}
      <LeftPanel />

      {/* Panel Putih Kanan (Form Login) */}
      <RightPanel redirectTo={searchParams.redirect} />
    </div>
  );
}
