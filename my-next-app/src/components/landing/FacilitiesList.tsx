import * as React from "react";
import { CheckCircle2 } from "lucide-react";

interface FacilitiesListProps {
  fasilitas: string[];
}

export const FacilitiesList: React.FC<FacilitiesListProps> = ({ fasilitas }) => {
  return (
    <div className="pt-2">
      <h5 className="text-sm font-bold text-slate-800 mb-2.5">
        Fasilitas Termasuk:
      </h5>
      <ul className="space-y-2">
        {fasilitas.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-xs text-slate-600">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span className="leading-tight">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
