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
import { ShieldCheck, Lock, Trash2, LayoutGrid, ListFilter, Search, RefreshCw, AlertTriangle, FolderPlus, Plus, Layers } from "lucide-react";

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [folders, setFolders] = useState<FolderWithStats[]>([]);
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  // Folder navigation state
  const [currentFolder, setCurrentFolder] = useState<FolderType | null>(null);

  // Modals state
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<FolderType | null>(null);

  const [isFileEditModalOpen, setIsFileEditModalOpen] = useState(false);
  const [fileToEdit, setFileToEdit] = useState<FileMetadata | null>(null);

  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");

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
    loadData();
  }, [currentFolder]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch all folders
      const resFolders = await fetch("/api/folders");
      if (resFolders.ok) {
        const dataFolders = await resFolders.json();
        setFolders(dataFolders);
      }

      // Fetch files for current folder context
      const folderParam = currentFolder ? currentFolder.id : "root";
      const resFiles = await fetch(`/api/files?folderId=${folderParam}`);
      if (resFiles.ok) {
        const dataFiles = await resFiles.json();
        setFiles(dataFiles);
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

  const filteredFolders = folders.filter((f) => {
    if (currentFolder) return false;
    const query = searchQuery.toLowerCase();
    return f.name.toLowerCase().includes(query) || (f.description && f.description.toLowerCase().includes(query));
  });

  const filteredFiles = files.filter((f) => {
    const query = searchQuery.toLowerCase();
    return f.name.toLowerCase().includes(query) || (f.description && f.description.toLowerCase().includes(query));
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
              Gestión de Carpetas y Archivos
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Crea carpetas, sube archivos HTML/PNG, edita nombres/descripciones y reemplaza contenidos.
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
              <span>Nueva Carpeta</span>
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
              onNavigateHome={() => setCurrentFolder(null)}
            />

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {currentFolder ? `Contenido de "${currentFolder.name}"` : "Gestión Global del Repositorio"}
                </h3>
                <p className="text-xs text-slate-400">Administración de carpetas y archivos</p>
              </div>

              <div className="flex items-center gap-3 justify-end">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Filtrar..."
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
                  onClick={loadData}
                  title="Actualizar"
                  className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="space-y-8">
              {/* Folders List (at root) */}
              {!currentFolder && filteredFolders.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Carpetas ({filteredFolders.length})</h4>
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
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Archivos ({filteredFiles.length})</h4>
                {viewMode === "table" ? (
                  <FileTable
                    files={filteredFiles}
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
