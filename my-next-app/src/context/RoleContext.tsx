"use client";

import * as React from "react";
import { ROLE_LABELS, type SessionUser, type UserRole } from "@/lib/auth/roles";

export type { SessionUser, UserRole } from "@/lib/auth/roles";

interface RoleContextValue {
  role: UserRole;
  roleLabel: string;
  /** Identitas asli dari Supabase Auth + tabel profiles. */
  user: SessionUser;
  userId: string;
  userName: string;
}

const RoleContext = React.createContext<RoleContextValue | null>(null);

interface RoleProviderProps {
  user: SessionUser;
  children: React.ReactNode;
}

export const RoleProvider: React.FC<RoleProviderProps> = ({ user, children }) => {
  const value = React.useMemo<RoleContextValue>(
    () => ({
      role: user.role,
      roleLabel: ROLE_LABELS[user.role],
      user,
      userId: user.id,
      userName: user.name,
    }),
    [user]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

export function useRole(): RoleContextValue {
  const context = React.useContext(RoleContext);
  if (!context) {
    throw new Error("useRole hanya bisa dipakai di dalam layout dashboard (RoleProvider).");
  }
  return context;
}
