"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import type { SessionUser } from "@/lib/auth/roles";

const loginSchema = z.object({
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
  rememberMe: z.boolean().optional(),
});

function safeRedirectTarget(value?: string | null): string | null {
  if (!value) return null;
  // Hanya path internal; hindari open redirect ke domain lain.
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

interface LoginFormProps {
  redirectTo?: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({ redirectTo }) => {
  const router = useRouter();

  // Form State
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(false);

  const [showPassword, setShowPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = React.useState(false);
  const [forgotEmail, setForgotEmail] = React.useState("");
  const [forgotError, setForgotError] = React.useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validation = loginSchema.safeParse({ email, password, rememberMe });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const supabase = createClient();
      const cleanEmail = email.trim().toLowerCase();

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (signInError || !data.user) {
        const raw = signInError?.message || "";
        setErrorMessage(
          /invalid login credentials/i.test(raw)
            ? "Email atau kata sandi tidak valid. Silakan coba lagi."
            : raw || "Login gagal. Pastikan email dan kata sandi benar."
        );
        setIsLoading(false);
        return;
      }

      // Token sesi sudah ditulis @supabase/ssr ke cookie; ambil peran aslinya
      // dari tabel profiles lewat endpoint sesi (divalidasi server).
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const payload = (await res.json().catch(() => null)) as {
        user?: SessionUser;
      } | null;

      if (!res.ok || !payload?.user) {
        // Sesi ada tapi profil/peran tidak terbaca: logout agar tidak nyangkut.
        await supabase.auth.signOut();
        setErrorMessage(
          "Akun ini belum memiliki data profil di sistem. Hubungi admin cabang untuk aktivasi akun."
        );
        setIsLoading(false);
        return;
      }

      const target = safeRedirectTarget(redirectTo) || payload.user.homePath;
      router.push(target);
      router.refresh();
    } catch (err) {
      console.error("Login unexpected error:", err);
      setErrorMessage("Terjadi gangguan koneksi ke server. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotError(null);
    setIsLoading(false);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(
        forgotEmail.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/auth/callback?next=/login` }
      );
      if (error) {
        setForgotError(error.message);
        return;
      }
      setForgotSuccess(true);
      setTimeout(() => {
        setForgotSuccess(false);
        setIsForgotModalOpen(false);
        setForgotEmail("");
      }, 3500);
    } catch {
      setForgotError("Gagal mengirim email reset. Coba beberapa saat lagi.");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200"
          >
            {errorMessage}
          </div>
        )}

        {/* Email Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Email
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: "" });
              }}
              placeholder="Email"
              autoComplete="username"
              className={`w-full rounded-xl border bg-slate-50/70 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:bg-white focus:border-transparent transition ${
                errors.email ? "border-red-500" : "border-slate-200"
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-600 font-medium">{errors.email}</p>
          )}
        </div>

        {/* Password Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700">
              Password
            </label>
            <button
              type="button"
              onClick={() => setIsForgotModalOpen(true)}
              className="text-xs text-[#0d9488] font-medium hover:underline hover:text-teal-700 transition"
            >
              Lupa password?
            </button>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: "" });
              }}
              placeholder="Password"
              autoComplete="current-password"
              className={`w-full rounded-xl border bg-slate-50/70 py-2.5 pl-9 pr-10 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:bg-white focus:border-transparent transition ${
                errors.password ? "border-red-500" : "border-slate-200"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-600 font-medium">{errors.password}</p>
          )}
        </div>

        {/* Remember Me Checkbox */}
        <div className="pt-1">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#0d9488] focus:ring-[#0d9488] accent-[#0d9488]"
            />
            <span className="text-xs text-slate-600 font-normal">
              Ingat saya di perangkat ini
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition duration-200 shadow-md shadow-teal-700/20 disabled:opacity-70"
          >
            {isLoading ? "Memproses..." : "Masuk"}
          </button>
        </div>

        {/* Bottom Help Notice */}
        <div className="mt-6 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-center">
          <p className="text-xs text-slate-500 leading-relaxed">
            Belum punya akun? Akun jamaah, agen, dan muthawif dibuat oleh staf
            kantor. Silakan hubungi admin cabang Anda untuk mendapatkan akses.
          </p>
        </div>
      </form>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Pemulihan Kata Sandi"
        description="Masukkan email akun Anda untuk mendapatkan tautan verifikasi reset password."
        maxWidth="md"
      >
        {forgotSuccess ? (
          <div className="rounded-xl bg-teal-50 p-4 text-center border border-teal-200 space-y-2">
            <ShieldCheck className="h-10 w-10 text-[#0d9488] mx-auto" />
            <p className="text-sm font-bold text-teal-900">
              Tautan Reset Terkirim!
            </p>
            <p className="text-xs text-teal-700">
              Silakan periksa kotak masuk atau spam email Anda.
            </p>
          </div>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-4 pt-2">
            {forgotError && (
              <div
                role="alert"
                className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200"
              >
                {forgotError}
              </div>
            )}
            <Input
              label="Email Terdaftar"
              type="email"
              placeholder="nama@travel.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              leftIcon={<KeyRound className="h-4 w-4" />}
              required
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsForgotModalOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" variant="default" size="sm">
                Kirim Tautan Reset
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
};
