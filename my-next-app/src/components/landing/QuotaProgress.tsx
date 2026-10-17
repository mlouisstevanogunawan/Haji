import * as React from "react";
import { Quota } from "@/data/packages";

interface QuotaProgressProps {
  kuota: Quota;
}

// Hanya menampilkan kuota total dari kolom `quota` di database. Tidak ada angka
// "terisi" karangan maupun progress bar yang menyesatkan.
export const QuotaProgress: React.FC<QuotaProgressProps> = ({ kuota }) => {
  return (
    <div className="space-y-1.5 my-3 pt-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 font-normal">Kuota Paket</span>
        <span className="text-emerald-600 font-bold">
          {`${kuota.total} Kursi`}
        </span>
      </div>
    </div>
  );
};
