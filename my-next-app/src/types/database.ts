export type UserRole =
  | "super_admin"
  | "admin_cabang"
  | "mitra_agen"
  | "muthawif"
  | "jamaah"
  | "jamaah_umroh";

export interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  avatar_text?: string | null;
  role: UserRole;
  branch_id?: string | null;
  branch?: Branch | null;
  branch_name?: string | null;
  is_active: boolean;
  phone?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string | null;
  user_name?: string | null;
  action: string;
  description: string;
  ip_address?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
  user?: {
    id: string;
    full_name?: string | null;
    email?: string | null;
    role?: string;
  } | null;
}

export interface CreateUserData {
  email: string;
  password?: string;
  full_name: string;
  role: UserRole;
  branch_id?: string | null;
  branch_name?: string | null;
  phone?: string | null;
  is_active?: boolean;
}

export interface UpdateUserData {
  id: string;
  full_name?: string;
  role?: UserRole;
  branch_id?: string | null;
  phone?: string | null;
  is_active?: boolean;
}
