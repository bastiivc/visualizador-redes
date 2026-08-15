"use client";

import { useState, useEffect } from "react";
import { Search, LayoutGrid, ListFilter, RefreshCw, Sparkles, Lock, ShieldCheck, FolderPlus, Layers } from "lucide-react";
import Navbar from "@/components/Navbar";
import StatCards from "@/components/StatCards";
import FolderCard from "@/components/folders/FolderCard";
import FolderBreadcrumbs from "@/components/folders/FolderBreadcrumbs";
import FileCard from "@/components/files/FileCard";
import FileTable from "@/components/files/FileTable";
import FileViewerModal from "@/components/FileViewerModal";
import AdminLoginModal from "@/components/AdminLoginModal";
import { FileMetadata, FolderWithStats, Folder as FolderType } from "@/lib/db/schema";

export default function GuestPage() {
  const [folders, setFolders] = useState<FolderWithStats[]>([]);
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  // Folder navigation state
  const [currentFolder, setCurrentFolder] = useState<FolderType | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "size">("recent");

  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(null);
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem("pyvis_admin_key");
    if (storedKey) setAdminKey(storedKey);
    loadData();
  }, [currentFolder]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch folders if at root
      if (!currentFolder) {
        const resFolders = await fetch("/api/folders");
        if (resFolders.ok) {
          const dataFolders = await resFolders.json();
          setFolders(dataFolders);
        }
      }

      // Fetch files for current folder location
      const folderParam = currentFolder ? currentFolder.id : "root";
      const resFiles = await fetch(`/api/files?folderId=${folderParam}`);
      if (resFiles.ok) {
        const dataFiles = await resFiles.json();
        setFiles(dataFiles);
      }
    } catch (err) {
      console.error("Error al cargar repositorio:", err);
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

  // Filtering & Sorting
  const filteredFolders = folders.filter((f) => {
    if (currentFolder) return false; // Don't show nested folders when inside a folder
    const query = searchQuery.toLowerCase();
    return f.name.toLowerCase().includes(query) || (f.description && f.description.toLowerCase().includes(query));
  });

  const filteredFiles = files
    .filter((f) => {
      const query = searchQuery.toLowerCase();
      return f.name.toLowerCase().includes(query) || (f.description && f.description.toLowerCase().includes(query));
    })
    .sort((a, b) => {
      if (sortBy === "recent") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "size") return b.fileSizeBytes - a.fileSizeBytes;
      return 0;
    });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      <Navbar
        adminKey={adminKey}
        onAdminLogin={handleAdminLogin}
        onAdminLogout={handleAdminLogout}
        onNavigateHome={() => {
          setCurrentFolder(null);
          setSearchQuery("");
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="relative mb-8 p-8 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Repositorio de Grafos y Diagramas</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
              Explora tus <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Redes y Carpetas</span>
            </h1>
            
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Organiza tus proyectos por carpetas. Visualiza grafos HTML interactivos de PyVis e imágenes PNG con total claridad y detalle.
            </p>

            {!adminKey ? (
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-medium transition-colors"
              >
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>¿Eres Administrador? Inicia sesión para crear carpetas, subir y editar archivos</span>
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
        <StatCards networks={files as any} />

        {/* Folder Breadcrumbs Trail */}
        <FolderBreadcrumbs
          currentFolder={currentFolder}
          onNavigateHome={() => setCurrentFolder(null)}
        />

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder={currentFolder ? `Buscar en ${currentFolder.name}...` : "Buscar carpeta o archivo..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 justify-end">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="recent">Más Recientes</option>
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
              onClick={loadData}
              title="Actualizar"
              className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Content Display */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-slate-400">Cargando elementos...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Folders Section (Only at Root) */}
            {!currentFolder && filteredFolders.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FolderPlus className="w-4 h-4 text-cyan-400" />
                  <span>Carpetas del Repositorio ({filteredFolders.length})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredFolders.map((folder) => (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      onClick={(f) => setCurrentFolder(f)}
                      isAdmin={false}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Files Section */}
            <div>
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>
                  {currentFolder ? `Archivos en "${currentFolder.name}"` : "Archivos en Raíz"} ({filteredFiles.length})
                </span>
              </h3>

              {filteredFiles.length === 0 && (!currentFolder || filteredFolders.length === 0) ? (
                <div className="py-16 px-4 text-center bg-slate-900/50 border border-slate-800 rounded-3xl">
                  <p className="text-sm text-slate-400 mb-1">No hay archivos ni carpetas en esta ubicación.</p>
                  <p className="text-xs text-slate-500">Inicia sesión como Administrador para agregar nuevas carpetas o subir archivos.</p>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredFiles.map((file) => (
                    <FileCard
                      key={file.id}
                      file={file}
                      onView={(f) => setSelectedFile(f)}
                      isAdmin={false}
                    />
                  ))}
                </div>
              ) : (
                <FileTable
                  files={filteredFiles}
                  onView={(f) => setSelectedFile(f)}
                  isAdmin={false}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Unified Multi-Format File Viewer Modal */}
      <FileViewerModal
        file={selectedFile}
        onClose={() => setSelectedFile(null)}
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
