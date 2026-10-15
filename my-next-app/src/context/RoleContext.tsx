"use client";

import * as React from "react";

export type UserRole =
  | "super_admin"
  | "admin_cabang"
  | "mitra_agen"
  | "jamaah_umroh"
  | "muthawif";

export interface RoleConfig {
  id: UserRole;
  title: string;
  headerTitle: string;
  label: string;
  name: string;
  subtitle: string;
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  super_admin: {
    id: "super_admin",
    title: "Super Admin",
    headerTitle: "Dashboard Operasional",
    label: "Super Admin",
    name: "Ustadz Al-Hafidz",
    subtitle: "Pusat Kendali Operasional",
  },
  admin_cabang: {
    id: "admin_cabang",
    title: "Admin Cabang",
    headerTitle: "Dashboard Cabang",
    label: "Admin Cabang",
    name: "Rizky Darmawan",
    subtitle: "Kantor Cabang Jakarta Selatan",
  },
  mitra_agen: {
    id: "mitra_agen",
    title: "Mitra Agen",
    headerTitle: "Portal Kemitraan Agen",
    label: "Mitra Agen",
    name: "Hasan Basri",
    subtitle: "Mitra Resmi AGN-001",
  },
  jamaah_umroh: {
    id: "jamaah_umroh",
    title: "Jamaah Umroh",
    headerTitle: "Portal Perjalanan Saya",
    label: "Jamaah Umroh",
    name: "Ahmad Fauzi",
    subtitle: "Jamaah Kloter Syawal 1447H",
  },
  muthawif: {
    id: "muthawif",
    title: "Muthawif / Guide",
    headerTitle: "Portal Bimbingan Muthawif",
    label: "Muthawif / Guide",
    name: "Ustadz Abdullah",
    subtitle: "Pembimbing Ibadah Senior",
  },
};

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  config: RoleConfig;
}

const RoleContext = React.createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = React.useState<UserRole>("super_admin");

  React.useEffect(() => {
    // Check localStorage or cookies for active role
    if (typeof window !== "undefined") {
      const savedRole = localStorage.getItem("umroh_active_role") as UserRole;
      if (savedRole && ROLE_CONFIGS[savedRole]) {
        setRoleState(savedRole);
      }
    }
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (typeof window !== "undefined") {
      localStorage.setItem("umroh_active_role", newRole);
    }
  };

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole,
        config: ROLE_CONFIGS[role],
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export function useRole() {
  const context = React.useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
