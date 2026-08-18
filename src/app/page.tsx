"use client";

import { useState, useEffect } from "react";
import { Search, LayoutGrid, Table, RefreshCw, Sparkles, Lock, ShieldCheck, FolderPlus, Layers, Filter, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import StatCards from "@/components/StatCards";
import FolderCard from "@/components/folders/FolderCard";
import FolderTable from "@/components/folders/FolderTable";
import FolderBreadcrumbs from "@/components/folders/FolderBreadcrumbs";
import FileCard from "@/components/files/FileCard";
import FileTable from "@/components/files/FileTable";
import FileViewerModal from "@/components/FileViewerModal";
import AdminLoginModal from "@/components/AdminLoginModal";
import { FileMetadata, FolderWithStats, Folder as FolderType } from "@/lib/db/schema";

export default function GuestPage() {
  const [folders, setFolders] = useState<FolderWithStats[]>([]);
  const [allFoldersMap, setAllFoldersMap] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  // Folder navigation state
  const [currentFolder, setCurrentFolder] = useState<FolderType | null>(null);
  const [folderPath, setFolderPath] = useState<FolderType[]>([]);

  // Filtering & Sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState<"all" | "html" | "png">("all");
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "name-asc" | "name-desc" | "size-desc" | "size-asc" | "nodes-desc">("recent");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(null);
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem("pyvis_admin_key");
    if (storedKey) setAdminKey(storedKey);
  }, []);

  useEffect(() => {
    loadData();
  }, [currentFolder, searchQuery]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all folders for global folder map
      const resAllFolders = await fetch("/api/folders");
      if (resAllFolders.ok) {
        const dataAllFolders: FolderWithStats[] = await resAllFolders.json();
        const map: Record<string, string> = {};
        dataAllFolders.forEach((f) => {
          map[f.id] = f.name;
        });
        setAllFoldersMap(map);
      }

      // 2. Fetch folders for current parent level
      const parentParam = currentFolder ? currentFolder.id : "root";
      const resFolders = await fetch(`/api/folders?parentId=${parentParam}`);
      if (resFolders.ok) {
        const dataFolders = await resFolders.json();
        setFolders(dataFolders);
      }

      // 3. Fetch files (If searching at root, fetch all files across subfolders)
      let filesUrl = `/api/files?folderId=${parentParam}`;
      if (!currentFolder && searchQuery.trim() !== "") {
        filesUrl = "/api/files";
      }

      const resFiles = await fetch(filesUrl);
      if (resFiles.ok) {
        const dataFiles = await resFiles.json();
        setFiles(dataFiles);
      }

      // 4. Fetch breadcrumb path if inside a folder
      if (currentFolder) {
        const resPath = await fetch(`/api/folders?ancestorsOf=${currentFolder.id}`);
        if (resPath.ok) {
          const pathData = await resPath.json();
          setFolderPath(pathData);
        }
      } else {
        setFolderPath([]);
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

  const clearFilters = () => {
    setSearchQuery("");
    setFileTypeFilter("all");
    setSortBy("recent");
  };

  // Unified Filtering & Sorting
  const filteredFolders = folders
    .filter((f) => {
      if (fileTypeFilter === "html" && (f.htmlCount || 0) === 0) return false;
      if (fileTypeFilter === "png" && (f.pngCount || 0) === 0) return false;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return f.name.toLowerCase().includes(query) || (f.description && f.description.toLowerCase().includes(query));
    })
    .sort((a, b) => {
      if (sortBy === "recent") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      if (sortBy === "size-desc") return (b.totalSizeBytes || b.fileCount || 0) - (a.totalSizeBytes || a.fileCount || 0);
      if (sortBy === "size-asc") return (a.totalSizeBytes || a.fileCount || 0) - (b.totalSizeBytes || b.fileCount || 0);
      if (sortBy === "nodes-desc") return (b.fileCount || 0) - (a.fileCount || 0);
      return 0;
    });

  const filteredFiles = files
    .filter((f) => {
      if (fileTypeFilter !== "all" && f.fileType !== fileTypeFilter) return false;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return f.name.toLowerCase().includes(query) || (f.description && f.description.toLowerCase().includes(query));
    })
    .sort((a, b) => {
      if (sortBy === "recent") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      if (sortBy === "size-desc") return b.fileSizeBytes - a.fileSizeBytes;
      if (sortBy === "size-asc") return a.fileSizeBytes - b.fileSizeBytes;
      if (sortBy === "nodes-desc") return (b.nodeCount || 0) - (a.nodeCount || 0);
      return 0;
    });

  const isFilterActive = searchQuery.trim() !== "" || fileTypeFilter !== "all" || sortBy !== "recent";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 transition-colors">
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
        <div className="relative mb-8 p-8 bg-gradient-to-r from-slate-100 via-white to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-md dark:shadow-2xl transition-colors">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-600 dark:text-cyan-400 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Repositorio de Grafos y Diagramas</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
              Explora tus <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-500">Redes y Carpetas</span>
            </h1>
            
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
              Organiza tus proyectos por carpetas y subcarpetas. Visualiza grafos HTML interactivos de PyVis e imágenes PNG con total claridad.
            </p>

            {!adminKey ? (
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors shadow-sm"
              >
                <Lock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>¿Eres Administrador? Inicia sesión para crear carpetas, subir y editar archivos</span>
              </button>
            ) : (
              <a
                href="/admin"
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 rounded-xl text-xs font-semibold transition-colors"
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
          folderPath={folderPath}
          onNavigateHome={() => setCurrentFolder(null)}
          onNavigateToFolder={(f) => setCurrentFolder(f)}
        />

        {/* Filter Toolbar */}
        <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6 shadow-sm dark:shadow-lg transition-colors">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder={currentFolder ? `Buscar en "${currentFolder.name}"...` : "Buscar en todo el repositorio..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
              />
            </div>

            {/* Filter Selectors & View Mode */}
            <div className="flex flex-wrap items-center gap-3 justify-end">
              {/* Format Filter */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                <select
                  value={fileTypeFilter}
                  onChange={(e: any) => setFileTypeFilter(e.target.value)}
                  className="bg-transparent text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer pr-1"
                >
                  <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Todos los formatos</option>
                  <option value="html" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Grafos HTML (PyVis)</option>
                  <option value="png" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Imágenes PNG</option>
                </select>
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="recent" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Más Recientes</option>
                <option value="oldest" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Más Antiguos</option>
                <option value="name-asc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Nombre (A - Z)</option>
                <option value="name-desc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Nombre (Z - A)</option>
                <option value="size-desc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Mayor Tamaño</option>
                <option value="size-asc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Menor Tamaño</option>
                <option value="nodes-desc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Mayor N° de Nodos</option>
              </select>

              {/* View Switcher */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  title="Vista Tarjetas"
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === "grid" ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold" : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  title="Vista Tabla"
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === "table" ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold" : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <Table className="w-4 h-4" />
                </button>
              </div>

              {/* Refresh */}
              <button
                onClick={loadData}
                title="Actualizar datos"
                className="p-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Active Filters Pill Bar */}
          {isFilterActive && (
            <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Filtros activos:</span>
                {searchQuery && (
                  <span className="px-2.5 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 rounded-lg">
                    Texto: "{searchQuery}"
                  </span>
                )}
                {fileTypeFilter !== "all" && (
                  <span className="px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 rounded-lg uppercase">
                    Tipo: {fileTypeFilter}
                  </span>
                )}
                {sortBy !== "recent" && (
                  <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg">
                    Orden: {sortBy}
                  </span>
                )}
              </div>
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors shrink-0 font-medium"
              >
                <X className="w-3.5 h-3.5" />
                <span>Limpiar filtros</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Display */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Cargando repositorio...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Folders Section */}
            {filteredFolders.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FolderPlus className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>
                    {currentFolder ? `Subcarpetas en "${currentFolder.name}"` : "Carpetas Principales"} ({filteredFolders.length})
                  </span>
                </h3>
                {viewMode === "grid" ? (
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
                ) : (
                  <FolderTable
                    folders={filteredFolders}
                    onClick={(f) => setCurrentFolder(f)}
                    isAdmin={false}
                  />
                )}
              </div>
            )}

            {/* Files Section */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>
                  {currentFolder
                    ? `Archivos en "${currentFolder.name}"`
                    : searchQuery.trim()
                    ? "Resultados de búsqueda en todo el repositorio"
                    : "Archivos en Raíz"} ({filteredFiles.length})
                </span>
              </h3>

              {filteredFiles.length === 0 && filteredFolders.length === 0 ? (
                <div className="py-16 px-4 text-center bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm dark:shadow-md">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">No se encontraron archivos ni carpetas.</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Prueba ajustando los criterios de búsqueda o filtros.</p>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredFiles.map((file) => (
                    <FileCard
                      key={file.id}
                      file={file}
                      folderName={file.folderId ? allFoldersMap[file.folderId] : undefined}
                      onView={(f) => setSelectedFile(f)}
                      isAdmin={false}
                    />
                  ))}
                </div>
              ) : (
                <FileTable
                  files={filteredFiles}
                  folderMap={allFoldersMap}
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
