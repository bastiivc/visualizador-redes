"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Network, ShieldCheck, Shield, Lock, Sparkles, UserCheck, PlusCircle } from "lucide-react";
import AdminLoginModal from "./AdminLoginModal";

interface NavbarProps {
  adminKey: string | null;
  onAdminLogin: (key: string) => void;
  onAdminLogout: () => void;
  onNavigateHome?: () => void;
}

export default function Navbar({ adminKey, onAdminLogin, onAdminLogout, onNavigateHome }: NavbarProps) {
  const pathname = usePathname();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const isAdmin = Boolean(adminKey);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            onClick={() => {
              if (onNavigateHome) onNavigateHome();
            }}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl text-slate-950 font-bold shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform duration-200">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight group-hover:text-cyan-400 transition-colors">
                PyVis Hub
              </span>
              <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                Visualizador de Grafos
              </span>
            </div>
          </Link>

          {/* Navigation & Roles */}
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                pathname === "/"
                  ? "bg-slate-800 text-cyan-400 border border-slate-700"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              Invitado (Grafos)
            </Link>

            {isAdmin ? (
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  pathname === "/admin"
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Panel Admin</span>
              </Link>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-cyan-400 hover:bg-slate-900 transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Acceso Admin</span>
              </button>
            )}

            {/* Current Active Mode Badge */}
            {isAdmin ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <span className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Modo Admin Activo</span>
                </span>
                <button
                  onClick={onAdminLogout}
                  className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Cerrar sesión de administrador"
                >
                  Salir Admin
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 text-slate-400 rounded-full text-xs font-medium">
                  <Shield className="w-3.5 h-3.5 text-slate-500" />
                  <span>Invitado</span>
                </span>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={(key) => {
          onAdminLogin(key);
        }}
      />
    </>
  );
}
