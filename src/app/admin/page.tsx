"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import StatCards from "@/components/StatCards";
import UploadDropzone from "@/components/UploadDropzone";
import NetworkCard from "@/components/NetworkCard";
import NetworkTable from "@/components/NetworkTable";
import NetworkViewerModal from "@/components/NetworkViewerModal";
import AdminLoginModal from "@/components/AdminLoginModal";
import { NetworkMetadata } from "@/lib/db/schema";
import { ShieldCheck, Lock, Trash2, LayoutGrid, ListFilter, Search, RefreshCw, AlertTriangle } from "lucide-react";

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [networks, setNetworks] = useState<NetworkMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkMetadata | null>(null);

  const [deleteIdCandidate, setDeleteIdCandidate] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem("pyvis_admin_key");
    if (storedKey) {
      setAdminKey(storedKey);
    } else {
      setIsLoginModalOpen(true);
    }
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
    setIsLoginModalOpen(false);
  };

  const handleAdminLogout = () => {
    setAdminKey(null);
    localStorage.removeItem("pyvis_admin_key");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteIdCandidate || !adminKey) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/networks/${deleteIdCandidate}`, {
        method: "DELETE",
        headers: {
          "x-admin-key": adminKey,
        },
      });

      if (res.ok) {
        setDeleteIdCandidate(null);
        fetchNetworks();
      } else {
        const data = await res.json();
        alert(data.error || "Error al eliminar la red.");
      }
    } catch (err) {
      alert("Error de red al intentar eliminar.");
    } finally {
      setDeleting(false);
    }
  };

  const filteredNetworks = networks.filter((n) => {
    const query = searchQuery.toLowerCase();
    return (
      n.name.toLowerCase().includes(query) ||
      (n.description && n.description.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      <Navbar
        adminKey={adminKey}
        onAdminLogin={handleAdminLogin}
        onAdminLogout={handleAdminLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Admin Panel Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Vista Exclusiva de Administrador</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Gestión y Carga de Grafos
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Sube nuevos archivos .html de PyVis y gestiona las redes publicadas en el repositorio.
            </p>
          </div>

          {!adminKey && (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-xl text-xs transition-colors shadow-lg shadow-cyan-500/20"
            >
              <Lock className="w-4 h-4" />
              <span>Desbloquear Modo Admin</span>
            </button>
          )}
        </div>

        {/* Lock Overlay if not authenticated as Admin */}
        {!adminKey ? (
          <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl max-w-xl mx-auto my-12 shadow-2xl">
            <div className="p-4 bg-slate-900 border border-slate-800 text-cyan-400 rounded-2xl w-fit mx-auto mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Acceso Restringido</h2>
            <p className="text-xs text-slate-400 mb-6">
              El panel de carga y eliminación de redes está reservado únicamente para el Rol de Administrador.
            </p>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/25 transition-colors"
            >
              Ingresar Clave de Administrador
            </button>
          </div>
        ) : (
          <>
            {/* Admin Upload Zone Component */}
            <div className="mb-10">
              <UploadDropzone adminKey={adminKey} onSuccess={fetchNetworks} />
            </div>

            {/* Repositorio Stats KPI */}
            <StatCards networks={networks} />

            {/* Management Section Header */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Historial de Redes Cargas</h3>
                <p className="text-xs text-slate-400">Total: {networks.length} grafos almacenados</p>
              </div>

              <div className="flex items-center gap-3 justify-end">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Filtrar por nombre..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode("table")}
                    title="Vista Tabla"
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === "table" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <ListFilter className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    title="Vista Tarjetas"
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === "grid" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={fetchNetworks}
                  title="Actualizar"
                  className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* List / Table of Networks */}
            {viewMode === "table" ? (
              <NetworkTable
                networks={filteredNetworks}
                onView={(n) => setSelectedNetwork(n)}
                onDelete={(id) => setDeleteIdCandidate(id)}
                isAdmin={true}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNetworks.map((net) => (
                  <NetworkCard
                    key={net.id}
                    network={net}
                    onView={(n) => setSelectedNetwork(n)}
                    onDelete={(id) => setDeleteIdCandidate(id)}
                    isAdmin={true}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Delete Confirmation Dialog Modal */}
      {deleteIdCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">¿Eliminar esta red?</h3>
                <p className="text-xs text-slate-400">Esta acción no se puede deshacer y borrará el HTML de la base de datos.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setDeleteIdCandidate(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex items-center gap-2 px-5 py-2 bg-rose-500 hover:bg-rose-400 text-white font-semibold rounded-xl text-xs shadow-lg shadow-rose-500/25 transition-colors"
              >
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Sí, Eliminar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive PyVis Viewer Modal */}
      <NetworkViewerModal
        network={selectedNetwork}
        onClose={() => setSelectedNetwork(null)}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={(key) => {
          handleAdminLogin(key);
        }}
      />
    </div>
  );
}
