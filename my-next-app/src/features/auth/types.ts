import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid").min(1, "Email wajib diisi"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "superadmin" | "admin_operasional" | "staff_dokumen";
}
