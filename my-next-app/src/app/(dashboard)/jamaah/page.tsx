"use client";

import { useRole } from "@/context/RoleContext";
import DataJamaahPage from "../data-jamaah/page";
import JamaahBimbinganPage from "../jamaah-bimbingan/page";

export default function JamaahRoutePage() {
  const { role } = useRole();
  if (role === "muthawif") {
    return <JamaahBimbinganPage />;
  }
  return <DataJamaahPage />;
}
