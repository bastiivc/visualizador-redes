"use client";

import { useState, useEffect } from "react";
import { Search, LayoutGrid, ListFilter, RefreshCw, Layers, Sparkles, Lock, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import StatCards from "@/components/StatCards";
import NetworkCard from "@/components/NetworkCard";
import NetworkTable from "@/components/NetworkTable";
import NetworkViewerModal from "@/components/NetworkViewerModal";
import AdminLoginModal from "@/components/AdminLoginModal";
import { NetworkMetadata } from "@/lib/db/schema";

export default function GuestPage() {
  const [networks, setNetworks] = useState<NetworkMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "size">("recent");

  const [selectedNetwork, setSelectedNetwork] = useState<NetworkMetadata | null>(null);
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Load stored admin key from localStorage if available
  useEffect(() => {
    const storedKey = localStorage.getItem("pyvis_admin_key");
    if (storedKey) setAdminKey(storedKey);
    fetchNetworks();
  }, []);

  const fetchNetworks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/networks");
      if (res.ok) {
        const data = await res.json();
        setNetworks(data);
      }
    } catch (err) {
      console.error("Error al cargar redes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = (key: string) => {
    setAdminKey(key);
    localStorage.setItem("pyvis_admin_key", key);
  };

  const handleAdminLogout = () => {
    setAdminKey(null);
    localStorage.removeItem("pyvis_admin_key");
  };

  // Filtering and sorting logic
  const filteredNetworks = networks
    .filter((n) => {
      const query = searchQuery.toLowerCase();
      return (
        n.name.toLowerCase().includes(query) ||
        (n.description && n.description.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "size") {
        return b.fileSizeBytes - a.fileSizeBytes;
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      <Navbar
        adminKey={adminKey}
        onAdminLogin={handleAdminLogin}
        onAdminLogout={handleAdminLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="relative mb-8 p-8 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Portal de Visualización de Grafos PyVis</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
              Explora e Interactúa con tus <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Redes Interactivas</span>
            </h1>
            
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Bienvenido al repositorio central de grafos. Selecciona cualquier red subida para visualizarla interactivamente en tu navegador manteniendo todos sus controles de física, nodos y zoom de PyVis.
            </p>

            {!adminKey ? (
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-medium transition-colors"
              >
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>¿Eres Administrador? Inicia sesión para cargar o eliminar redes</span>
              </button>
            ) : (
              <a
                href="/admin"
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-xl text-xs font-semibold transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Ir al Panel Exclusivo de Administración</span>
              </a>
            )}
          </div>
        </div>

        {/* Repositorio Stats KPI */}
        <StatCards networks={networks} />

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar red por nombre o descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
          </div>

          {/* View Toggle & Controls */}
          <div className="flex items-center gap-3 justify-end">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="recent">Más Recientes primero</option>
              <option value="name">Nombre (A-Z)</option>
              <option value="size">Mayor Tamaño</option>
            </select>

            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode("grid")}
                title="Vista Tarjetas"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "grid" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                title="Vista Tabla"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "table" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <ListFilter className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={fetchNetworks}
              title="Actualizar lista"
              className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Network Content Display */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-slate-400">Cargando repositorio de grafos...</p>
          </div>
        ) : filteredNetworks.length === 0 ? (
          <div className="py-16 px-4 text-center bg-slate-900/50 border border-slate-800 rounded-3xl">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl w-fit mx-auto mb-4 text-slate-500">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">No se encontraron redes</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              {searchQuery ? "No hay ninguna red que coincida con tu búsqueda." : "Aún no se ha cargado ninguna red PyVis al repositorio."}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNetworks.map((net) => (
              <NetworkCard
                key={net.id}
                network={net}
                onView={(n) => setSelectedNetwork(n)}
                isAdmin={false}
              />
            ))}
          </div>
        ) : (
          <NetworkTable
            networks={filteredNetworks}
            onView={(n) => setSelectedNetwork(n)}
            isAdmin={false}
          />
        )}
      </main>

      {/* Interactive PyVis Viewer Modal */}
      <NetworkViewerModal
        network={selectedNetwork}
        onClose={() => setSelectedNetwork(null)}
      />

      {/* Admin Login Modal Trigger */}
      <AdminLoginModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={(key) => {
          handleAdminLogin(key);
        }}
      />
    </div>
  );
}
