"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Sparkles, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { loginSchema, LoginFormData } from "../types";
import { loginUser } from "../services/authService";

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = React.useState<LoginFormData>({
    email: "admin@alharamain.id",
    password: "Password123!",
    rememberMe: true,
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Forgot Password modal state
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = React.useState<boolean>(false);
  const [forgotEmail, setForgotEmail] = React.useState<string>("");
  const [forgotSuccess, setForgotSuccess] = React.useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Zod validation
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
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
      const response = await loginUser(result.data);
      if (response.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setErrorMessage(response.error || "Gagal masuk. Periksa email & password Anda.");
      }
    } catch {
      setErrorMessage("Terjadi gangguan koneksi ke server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes("@")) return;
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotSuccess(false);
      setIsForgotPasswordOpen(false);
    }, 2500);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMessage && (
          <div className="rounded-xl bg-red-50 p-3.5 text-xs font-medium text-red-700 border border-red-200 flex items-center gap-2">
            <span>{errorMessage}</span>
          </div>
        )}

        <Input
          label="Email Akun Resmi"
          type="email"
          placeholder="admin@alharamain.id"
          value={formData.email}
          onChange={(e) => {
            setFormData({ ...formData, email: e.target.value });
            if (errors.email) setErrors({ ...errors, email: "" });
          }}
          leftIcon={<Mail className="h-4 w-4" />}
          error={errors.email}
          required
        />

        <div>
          <Input
            label="Kata Sandi (Password)"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value });
              if (errors.password) setErrors({ ...errors, password: "" });
            }}
            leftIcon={<Lock className="h-4 w-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="hover:text-slate-700 transition"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            error={errors.password}
            required
          />

          <div className="flex items-center justify-between mt-2.5">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
              <input
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) =>
                  setFormData({ ...formData, rememberMe: e.target.checked })
                }
                className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500 accent-emerald-700"
              />
              <span>Ingat sesi saya</span>
            </label>

            <button
              type="button"
              onClick={() => setIsForgotPasswordOpen(true)}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 hover:underline"
            >
              Lupa Password?
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="gold"
          size="lg"
          className="w-full text-sm font-bold tracking-wide shadow-lg"
          isLoading={isLoading}
        >
          Masuk ke Portal Manajemen
        </Button>

        {/* Demo Quick Fill Card */}
        <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Kredensial Demo Cepat:</span>
          </div>
          <p className="text-xs text-slate-500">
            Email: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-emerald-800">admin@alharamain.id</code>
            <br className="sm:hidden" /> / Password: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-emerald-800">Password123!</code>
          </p>
        </div>
      </form>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        title="Pemulihan Kata Sandi"
        description="Masukkan email terdaftar Anda untuk menerima tautan instruksi reset password."
        maxWidth="md"
      >
        {forgotSuccess ? (
          <div className="rounded-xl bg-emerald-50 p-4 text-center border border-emerald-200 space-y-2">
            <ShieldCheck className="h-10 w-10 text-emerald-700 mx-auto" />
            <p className="text-sm font-bold text-emerald-900">
              Instruksi Pemulihan Telah Dikirim!
            </p>
            <p className="text-xs text-emerald-700">
              Silakan periksa kotak masuk atau spam email <strong>{forgotEmail}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 pt-2">
            <Input
              label="Email Terdaftar"
              type="email"
              placeholder="admin@alharamain.id"
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
                onClick={() => setIsForgotPasswordOpen(false)}
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
