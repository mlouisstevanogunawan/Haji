"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { DemoAccountSelector, DEMO_ACCOUNTS, DemoAccount } from "./DemoAccountSelector";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid").min(1, "Email wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
  rememberMe: z.boolean().optional(),
});

export const LoginForm: React.FC = () => {
  const router = useRouter();

  // Form State initialized with Super Admin demo values
  const [email, setEmail] = React.useState("admin@travel.com");
  const [password, setPassword] = React.useState("password");
  const [rememberMe, setRememberMe] = React.useState(true);
  const [selectedDemoId, setSelectedDemoId] = React.useState<string | null>("super_admin");

  const [showPassword, setShowPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = React.useState(false);
  const [forgotEmail, setForgotEmail] = React.useState("");
  const [forgotSuccess, setForgotSuccess] = React.useState(false);

  const handleDemoSelect = (account: DemoAccount) => {
    setSelectedDemoId(account.id);
    setEmail(account.email);
    setPassword("password");
    setErrors({});
    setErrorMessage(null);
  };

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
      // Set session cookie for middleware authentication
      document.cookie = "umroh_admin_session=authenticated; path=/; max-age=86400; SameSite=Lax";
      
      // Smooth redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 500);
    } catch {
      setErrorMessage("Terjadi gangguan koneksi. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotSuccess(false);
      setIsForgotModalOpen(false);
      setForgotEmail("");
    }, 2000);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">
            {errorMessage}
          </div>
        )}

        {/* Demo Account Selector Chips */}
        <DemoAccountSelector
          selectedId={selectedDemoId}
          onSelect={handleDemoSelect}
        />

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
                setSelectedDemoId(null);
                if (errors.email) setErrors({ ...errors, email: "" });
              }}
              placeholder="nama@travel.com"
              className={`w-full rounded-lg border bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition ${
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
              className="text-xs text-emerald-600 font-medium hover:underline hover:text-emerald-700"
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
              placeholder="••••••••"
              className={`w-full rounded-lg border bg-white py-2.5 pl-9 pr-10 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition ${
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
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
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
            className="w-full flex items-center justify-center bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition duration-200 shadow-sm disabled:opacity-70"
          >
            {isLoading ? "Memproses..." : "Masuk"}
          </button>
        </div>

        {/* Bottom Help Notice */}
        <div className="mt-6 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-center">
          <p className="text-xs text-slate-500 leading-relaxed">
            Belum punya akun? Akun jamaah, agen, dan muthawif dibuat oleh staf kantor.
            Silakan hubungi admin cabang Anda untuk mendapatkan akses.
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
          <div className="rounded-xl bg-emerald-50 p-4 text-center border border-emerald-200 space-y-2">
            <ShieldCheck className="h-10 w-10 text-emerald-600 mx-auto" />
            <p className="text-sm font-bold text-emerald-900">
              Tautan Reset Terkirim!
            </p>
            <p className="text-xs text-emerald-700">
              Silakan periksa kotak masuk atau spam email Anda.
            </p>
          </div>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-4 pt-2">
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
