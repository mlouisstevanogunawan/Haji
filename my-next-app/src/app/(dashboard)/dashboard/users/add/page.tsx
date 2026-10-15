"use client";

import * as React from "react";
import { UserForm } from "@/components/users/UserForm";

export default function AddUserPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Subtitle (Screenshot 2) */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Tambah Pengguna Baru
        </h1>
        <p className="text-xs text-slate-500">
          Buat akun login baru dan tentukan hak akses peran serta penempatan cabang
        </p>
      </div>

      {/* Form Container */}
      <div className="max-w-4xl">
        <UserForm />
      </div>
    </div>
  );
}
