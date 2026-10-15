import * as React from "react";
import Link from "next/link";
import { Compass, MapPin, Phone, Mail } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer id="kontak" className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12">
          {/* Kolom 1 - Company */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 text-white p-2 rounded-lg">
                <Compass className="w-6 h-6" />
              </div>
              <span className="text-white font-bold text-lg">
                Al-Madinah Tour &amp; Travel
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Melayani pendaftaran jamaah umroh dan haji dari kantor pusat Jakarta
              dan jaringan cabang di seluruh Indonesia dengan sistem digital
              modern terintegrasi.
            </p>
          </div>

          {/* Kolom 2 - Kantor Operasional */}
          <div>
            <h4 className="text-white font-bold text-base mb-4">
              Kantor Operasional
            </h4>
            <div className="space-y-3 text-sm text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-1" />
                <span>
                  Jl. M.H. Thamrin No. 12, Menteng, Jakarta Pusat, DKI Jakarta
                  10350
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>021-3901234 / +62 812-3456-7890</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>info@almadinahtour.com</span>
              </div>
            </div>
          </div>

          {/* Kolom 3 - Portal Pengguna */}
          <div>
            <h4 className="text-white font-bold text-base mb-4">
              Portal Pengguna
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed mb-5 max-w-sm">
              Akses masuk khusus staff kantor pusat, admin cabang, mitra agen,
              dan calon jamaah terdaftar.
            </p>
            <div>
              <Link
                href="/login"
                className="inline-block border border-white text-white hover:bg-white hover:text-slate-900 rounded-md px-5 py-2.5 text-sm font-semibold transition-colors duration-200"
              >
                Masuk ke Portal Sistem
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 mt-12 pt-8 text-center">
          <p className="text-xs text-slate-500">
            &copy; 2026 PT Al-Madinah Tour &amp; Travel. Seluruh Hak Cipta Dilindungi. Sistem Manajemen Terpadu v1.0.
          </p>
        </div>
      </div>
    </footer>
  );
};
