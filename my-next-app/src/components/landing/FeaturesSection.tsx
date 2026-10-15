import * as React from "react";
import { ShieldCheck, Building2, Users, Plane } from "lucide-react";
import { FEATURES } from "@/data/packages";

export const FeaturesSection: React.FC = () => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "ShieldCheck":
        return <ShieldCheck className="w-6 h-6 text-emerald-600" />;
      case "Building2":
        return <Building2 className="w-6 h-6 text-emerald-600" />;
      case "Users":
        return <Users className="w-6 h-6 text-emerald-600" />;
      case "Plane":
        return <Plane className="w-6 h-6 text-emerald-600" />;
      default:
        return <ShieldCheck className="w-6 h-6 text-emerald-600" />;
    }
  };

  return (
    <section id="keunggulan" className="bg-white py-16 sm:py-20 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURES.map((item) => (
            <div key={item.id} className="flex flex-col items-start">
              {/* Icon Container */}
              <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl inline-flex items-center justify-center mb-4">
                {getIcon(item.iconName)}
              </div>

              {/* Title */}
              <h3 className="font-bold text-slate-800 text-base mb-1.5">
                {item.title}
              </h3>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
