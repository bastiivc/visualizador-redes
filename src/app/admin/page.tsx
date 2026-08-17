"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import StatCards from "@/components/StatCards";
import UploadDropzone from "@/components/UploadDropzone";
import FolderCard from "@/components/folders/FolderCard";
import FolderBreadcrumbs from "@/components/folders/FolderBreadcrumbs";
import FolderModal from "@/components/folders/FolderModal";
import FileCard from "@/components/files/FileCard";
import FileTable from "@/components/files/FileTable";
import FileEditModal from "@/components/files/FileEditModal";
import FileViewerModal from "@/components/FileViewerModal";
import AdminLoginModal from "@/components/AdminLoginModal";
import { FileMetadata, FolderWithStats, Folder as FolderType } from "@/lib/db/schema";
import { ShieldCheck, Lock, Trash2, LayoutGrid, Table, Search, RefreshCw, AlertTriangle, FolderPlus, Plus, Layers, Filter, X } from "lucide-react";

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

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
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");

  // Modals state
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<FolderType | null>(null);

  const [isFileEditModalOpen, setIsFileEditModalOpen] = useState(false);
  const [fileToEdit, setFileToEdit] = useState<FileMetadata | null>(null);

  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(null);

  // Deletion confirm modal
  const [deleteCandidate, setDeleteCandidate] = useState<{ id: string; type: "folder" | "file"; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem("pyvis_admin_key");
    if (storedKey) {
      setAdminKey(storedKey);
    } else {
      setIsLoginModalOpen(true);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [currentFolder, searchQuery]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all folders for global folder map lookup
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

      // 3. Fetch files (If searching at root, fetch all files)
      let filesUrl = `/api/files?folderId=${parentParam}`;
      if (!currentFolder && searchQuery.trim() !== "") {
        filesUrl = "/api/files";
      }

      const resFiles = await fetch(filesUrl);
      if (resFiles.ok) {
        const dataFiles = await resFiles.json();
        setFiles(dataFiles);
      }

      // 4. Fetch breadcrumbs path if inside folder
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
      console.error("Error al cargar datos de administración:", err);
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
    if (!deleteCandidate || !adminKey) return;
    setDeleting(true);

    try {
      const url = deleteCandidate.type === "folder" ? `/api/folders/${deleteCandidate.id}` : `/api/files/${deleteCandidate.id}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });

      if (res.ok) {
        setDeleteCandidate(null);
        if (deleteCandidate.type === "folder" && currentFolder?.id === deleteCandidate.id) {
          setCurrentFolder(null);
        }
        loadData();
      } else {
        const data = await res.json();
        alert(data.error || "Error al eliminar el elemento.");
      }
    } catch (err) {
      alert("Error al intentar eliminar.");
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFileTypeFilter("all");
    setSortBy("recent");
  };

  // Unified Filtering & Sorting
  const filteredFolders = folders
    .filter((f) => {
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
        {/* Header Admin Panel Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Vista Exclusiva de Administrador</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Gestión de Carpetas y Archivos
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Crea carpetas y subcarpetas, sube archivos HTML/PNG, edita nombres/descripciones y gestiona contenidos.
            </p>
          </div>

          {adminKey && (
            <button
              onClick={() => {
                setFolderToEdit(null);
                setIsFolderModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-lg shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>{currentFolder ? `Nueva Subcarpeta en "${currentFolder.name}"` : "Nueva Carpeta"}</span>
            </button>
          )}
        </div>

        {/* Lock Overlay if unauthenticated */}
        {!adminKey ? (
          <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl max-w-xl mx-auto my-12 shadow-2xl">
            <div className="p-4 bg-slate-900 border border-slate-800 text-cyan-400 rounded-2xl w-fit mx-auto mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Acceso Restringido</h2>
            <p className="text-xs text-slate-400 mb-6">
              El panel de gestión, carga y edición está reservado únicamente para Administradores.
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
            {/* Upload Zone */}
            <div className="mb-10">
              <UploadDropzone
                adminKey={adminKey}
                folders={folders}
                currentFolderId={currentFolder?.id}
                onSuccess={loadData}
              />
            </div>

            {/* Repositorio Stats KPI */}
            <StatCards networks={files as any} />

            {/* Breadcrumb Trail */}
            <FolderBreadcrumbs
              currentFolder={currentFolder}
              folderPath={folderPath}
              onNavigateHome={() => setCurrentFolder(null)}
              onNavigateToFolder={(f) => setCurrentFolder(f)}
            />

            {/* Toolbar */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 mb-6 shadow-lg">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                {/* Search input */}
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder={currentFolder ? `Filtrar en "${currentFolder.name}"...` : "Filtrar en todo el repositorio..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Filters & Actions */}
                <div className="flex flex-wrap items-center gap-3 justify-end">
                  {/* Format Filter */}
                  <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <select
                      value={fileTypeFilter}
                      onChange={(e: any) => setFileTypeFilter(e.target.value)}
                      className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer pr-1"
                    >
                      <option value="all" className="bg-slate-900 text-white">Todos los formatos</option>
                      <option value="html" className="bg-slate-900 text-white">Grafos HTML (PyVis)</option>
                      <option value="png" className="bg-slate-900 text-white">Imágenes PNG</option>
                    </select>
                  </div>

                  {/* Sort Dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="recent">Más Recientes</option>
                    <option value="oldest">Más Antiguos</option>
                    <option value="name-asc">Nombre (A - Z)</option>
                    <option value="name-desc">Nombre (Z - A)</option>
                    <option value="size-desc">Mayor Tamaño</option>
                    <option value="size-asc">Menor Tamaño</option>
                    <option value="nodes-desc">Mayor N° de Nodos</option>
                  </select>

                  {/* View Mode */}
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
                    <button
                      onClick={() => setViewMode("table")}
                      title="Vista Tabla"
                      className={`p-1.5 rounded-lg transition-colors ${
                        viewMode === "table" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      <Table className="w-4 h-4" />
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
                    onClick={loadData}
                    title="Actualizar"
                    className="p-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Active Filters Pill Bar */}
              {isFilterActive && (
                <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-800 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-400 font-medium">Filtros activos:</span>
                    {searchQuery && (
                      <span className="px-2.5 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg">
                        Texto: "{searchQuery}"
                      </span>
                    )}
                    {fileTypeFilter !== "all" && (
                      <span className="px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg uppercase">
                        Tipo: {fileTypeFilter}
                      </span>
                    )}
                    {sortBy !== "recent" && (
                      <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
                        Orden: {sortBy}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors shrink-0 font-medium"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Limpiar filtros</span>
                  </button>
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="space-y-8">
              {/* Folders List */}
              {filteredFolders.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FolderPlus className="w-4 h-4 text-cyan-400" />
                    <span>
                      {currentFolder ? `Subcarpetas en "${currentFolder.name}"` : "Carpetas Principales"} ({filteredFolders.length})
                    </span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFolders.map((folder) => (
                      <FolderCard
                        key={folder.id}
                        folder={folder}
                        onClick={(f) => setCurrentFolder(f)}
                        onEdit={(f) => {
                          setFolderToEdit(f);
                          setIsFolderModalOpen(true);
                        }}
                        onDelete={(f) => setDeleteCandidate({ id: f.id, type: "folder", name: f.name })}
                        isAdmin={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Files List */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>
                    {currentFolder
                      ? `Archivos en "${currentFolder.name}"`
                      : searchQuery.trim()
                      ? "Resultados de búsqueda en todo el repositorio"
                      : "Archivos en Raíz"} ({filteredFiles.length})
                  </span>
                </h4>
                {viewMode === "table" ? (
                  <FileTable
                    files={filteredFiles}
                    folderMap={allFoldersMap}
                    onView={(f) => setSelectedFile(f)}
                    onEdit={(f) => {
                      setFileToEdit(f);
                      setIsFileEditModalOpen(true);
                    }}
                    onDelete={(id) => {
                      const found = files.find((x) => x.id === id);
                      setDeleteCandidate({ id, type: "file", name: found?.name || "Archivo" });
                    }}
                    isAdmin={true}
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFiles.map((file) => (
                      <FileCard
                        key={file.id}
                        file={file}
                        folderName={file.folderId ? allFoldersMap[file.folderId] : undefined}
                        onView={(f) => setSelectedFile(f)}
                        onEdit={(f) => {
                          setFileToEdit(f);
                          setIsFileEditModalOpen(true);
                        }}
                        onDelete={(id) => {
                          const found = files.find((x) => x.id === id);
                          setDeleteCandidate({ id, type: "file", name: found?.name || "Archivo" });
                        }}
                        isAdmin={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">¿Eliminar {deleteCandidate.type === "folder" ? "Carpeta" : "Archivo"}?</h3>
                <p className="text-xs text-slate-400 truncate max-w-xs">{deleteCandidate.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-6">
              {deleteCandidate.type === "folder"
                ? "Esta acción borrará la carpeta y TODOS los archivos contenidos en ella."
                : "Esta acción borrará permanentemente este archivo de la base de datos."}
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setDeleteCandidate(null)}
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

      {/* Folder Creation / Edit Modal */}
      {adminKey && (
        <FolderModal
          isOpen={isFolderModalOpen}
          folderToEdit={folderToEdit}
          parentId={currentFolder?.id}
          adminKey={adminKey}
          onClose={() => {
            setIsFolderModalOpen(false);
            setFolderToEdit(null);
          }}
          onSuccess={loadData}
        />
      )}

      {/* File Edit & Replacement Modal */}
      {adminKey && (
        <FileEditModal
          isOpen={isFileEditModalOpen}
          fileToEdit={fileToEdit}
          folders={folders}
          adminKey={adminKey}
          onClose={() => {
            setIsFileEditModalOpen(false);
            setFileToEdit(null);
          }}
          onSuccess={loadData}
        />
      )}

      {/* File Viewer Modal */}
      <FileViewerModal
        file={selectedFile}
        onClose={() => setSelectedFile(null)}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleAdminLogin}
      />
    </div>
  );
}
