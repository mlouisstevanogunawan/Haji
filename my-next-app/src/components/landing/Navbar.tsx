"use client";

import * as React from "react";
import Link from "next/link";
import { Compass, ArrowRight, Menu, X } from "lucide-react";

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Left */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-emerald-600 text-white p-2 rounded-lg shadow-sm group-hover:bg-emerald-700 transition">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-slate-800 text-base sm:text-lg leading-tight">
                Al-Madinah Tour & Travel
              </div>
              <div className="text-[10px] sm:text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                PENYELENGGARA RESMI IZIN KEMENAG RI
              </div>
            </div>
          </Link>

          {/* Navigation Links Center (Desktop) */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#paket"
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition"
            >
              Paket Perjalanan
            </a>
            <a
              href="#keunggulan"
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition"
            >
              Keunggulan
            </a>
            <a
              href="#kontak"
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition"
            >
              Kontak Kami
            </a>
          </nav>

          {/* CTA Button Right (Desktop) */}
          <div className="hidden md:flex items-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-md transition duration-200 shadow-sm"
            >
              <span>Masuk ke Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-slate-50 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <a
            href="#paket"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 transition"
          >
            Paket Perjalanan
          </a>
          <a
            href="#keunggulan"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 transition"
          >
            Keunggulan
          </a>
          <a
            href="#kontak"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 transition"
          >
            Kontak Kami
          </a>
          <div className="pt-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-md transition shadow-sm"
            >
              <span>Masuk ke Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
