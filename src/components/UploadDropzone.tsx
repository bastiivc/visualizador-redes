"use client";

import { useState, useRef } from "react";
import { Upload, FileCode2, ImageIcon, CheckCircle2, AlertCircle, Sparkles, X, HardDrive, Cpu, Folder, Plus, Trash2 } from "lucide-react";
import { Folder as FolderType } from "@/lib/db/schema";
import { formatBytes, parsePyVisStats } from "@/lib/utils";

interface UploadDropzoneProps {
  adminKey: string;
  folders: FolderType[];
  currentFolderId?: string | null;
  onSuccess: () => void;
}

interface QueuedFile {
  id: string;
  file: File;
  name: string;
  description: string;
  fileType: "html" | "png";
  content: string;
  nodeCount: number | null;
  edgeCount: number | null;
  status: "idle" | "uploading" | "success" | "error";
  errorMsg?: string;
}

export default function UploadDropzone({
  adminKey,
  folders,
  currentFolderId,
  onSuccess,
}: UploadDropzoneProps) {
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(currentFolderId || "");

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const readSingleFile = (selectedFile: File): Promise<QueuedFile | null> => {
    return new Promise((resolve) => {
      const isHtml = selectedFile.name.toLowerCase().endsWith(".html");
      const isPng = selectedFile.name.toLowerCase().endsWith(".png");

      if (!isHtml && !isPng) {
        resolve(null);
        return;
      }

      const fileType = isPng ? "png" : "html";
      const autoName = selectedFile.name
        .replace(/\.(html|png)$/i, "")
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());

      const tempId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const reader = new FileReader();

      if (isPng) {
        reader.onload = (e) => {
          const content = (e.target?.result as string) || "";
          resolve({
            id: tempId,
            file: selectedFile,
            name: autoName,
            description: "",
            fileType,
            content,
            nodeCount: null,
            edgeCount: null,
            status: "idle",
          });
        };
        reader.readAsDataURL(selectedFile);
      } else {
        reader.onload = (e) => {
          const content = (e.target?.result as string) || "";
          const stats = parsePyVisStats(content);
          resolve({
            id: tempId,
            file: selectedFile,
            name: autoName,
            description: "",
            fileType,
            content,
            nodeCount: stats.nodeCount,
            edgeCount: stats.edgeCount,
            status: "idle",
          });
        };
        reader.readAsText(selectedFile);
      }
    });
  };

  const processSelectedFiles = async (files: FileList | File[]) => {
    setError(null);
    setSuccessMsg(null);

    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const readPromises = fileArray.map((f) => readSingleFile(f));
    const results = await Promise.all(readPromises);

    const validNewItems = results.filter((item): item is QueuedFile => item !== null);
    const rejectedCount = fileArray.length - validNewItems.length;

    if (rejectedCount > 0) {
      setError(
        `Se ignoraron ${rejectedCount} archivo(s) no válidos. Solo se admiten archivos .html o imágenes .png.`
      );
    }

    if (validNewItems.length > 0) {
      setQueuedFiles((prev) => [...prev, ...validNewItems]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFiles(e.dataTransfer.files);
    }
  };

  const removeFileFromQueue = (id: string) => {
    setQueuedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQueuedFile = (id: string, field: "name" | "description", value: string) => {
    setQueuedFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const clearAllFiles = () => {
    setQueuedFiles([]);
    setError(null);
    setSuccessMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (queuedFiles.length === 0) {
      setError("No hay archivos en la cola para subir.");
      return;
    }

    // Check if any file lacks a name
    const invalidItem = queuedFiles.find((item) => !item.name.trim());
    if (invalidItem) {
      setError("Todos los archivos deben tener un nombre antes de guardar.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const total = queuedFiles.length;
    let successCount = 0;
    let failCount = 0;
    const remainingQueue: QueuedFile[] = [];

    for (let i = 0; i < total; i++) {
      const item = queuedFiles[i];
      setUploadProgress({ current: i + 1, total });

      // Update status to uploading
      setQueuedFiles((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: "uploading" } : q))
      );

      try {
        const res = await fetch("/api/files", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": adminKey,
          },
          body: JSON.stringify({
            folderId: selectedFolderId || null,
            name: item.name.trim(),
            description: item.description.trim() || undefined,
            fileType: item.fileType,
            content: item.content,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Error al subir "${item.name}".`);
        }

        successCount++;
        setQueuedFiles((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: "success" } : q))
        );
      } catch (err: any) {
        failCount++;
        const errorMsg = err.message || "Error al subir.";
        remainingQueue.push({
          ...item,
          status: "error",
          errorMsg,
        });
        setQueuedFiles((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: "error", errorMsg } : q))
        );
      }
    }

    setLoading(false);
    setUploadProgress(null);

    if (successCount > 0) {
      onSuccess();
    }

    if (failCount === 0) {
      setSuccessMsg(`¡${successCount} archivo(s) se cargaron exitosamente!`);
      setQueuedFiles([]);
    } else if (successCount > 0) {
      setSuccessMsg(`Se cargaron ${successCount} archivo(s). Quedaron ${failCount} con error para reintentar.`);
      setQueuedFiles(remainingQueue);
    } else {
      setError("No se pudo cargar ningún archivo. Por favor verifica las alertas e intenta nuevamente.");
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl shadow-cyan-500/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Carga Múltiple de Archivos (HTML o PNG)</h3>
            <p className="text-xs text-slate-400">Sube múltiples redes interactivas (.html) o diagramas de imágenes (.png) a la vez</p>
          </div>
        </div>

        <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-full text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          Rol Administrador
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".html,.png"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Destination Folder Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Carpeta de Destino (para todos los archivos a subir)
          </label>
          <div className="relative">
            <Folder className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" />
            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
            >
              <option value="">(Raíz principal del repositorio)</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  📁 {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dropzone Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
            queuedFiles.length > 0 ? "p-4 border-slate-800 bg-slate-950/40 hover:border-slate-700" : "p-8 border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950"
          } ${isDragging ? "border-cyan-400 bg-cyan-500/10 scale-[1.01]" : ""}`}
        >
          {queuedFiles.length === 0 ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-cyan-400">
                  <FileCode2 className="w-6 h-6" />
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-purple-400">
                  <ImageIcon className="w-6 h-6" />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-200 mb-1">
                Haz clic para examinar o arrastra tus archivos <span className="text-cyan-400 font-mono">.html</span> o <span className="text-purple-400 font-mono">.png</span>
              </p>
              <p className="text-xs text-slate-500">Puedes seleccionar o soltar múltiples archivos simultáneamente</p>
            </>
          ) : (
            <div className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-xs font-semibold">
              <Plus className="w-4 h-4" />
              <span>Haz clic o arrastra más archivos (.html / .png) para agregar a la cola</span>
            </div>
          )}
        </div>

        {/* Queued Files List */}
        {queuedFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pt-2">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Archivos en cola para cargar ({queuedFiles.length})
              </h4>
              <button
                type="button"
                onClick={clearAllFiles}
                disabled={loading}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 rounded-lg text-xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar cola</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {queuedFiles.map((item, index) => (
                <div
                  key={item.id}
                  className={`p-4 bg-slate-950 border rounded-xl transition-all ${
                    item.status === "error"
                      ? "border-rose-500/40 bg-rose-950/10"
                      : item.status === "success"
                      ? "border-emerald-500/40 bg-emerald-950/10"
                      : item.status === "uploading"
                      ? "border-cyan-500/40 bg-cyan-950/10"
                      : "border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`p-2 rounded-lg border ${
                          item.fileType === "png"
                            ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                            : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                        }`}
                      >
                        {item.fileType === "png" ? <ImageIcon className="w-4 h-4" /> : <FileCode2 className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white truncate max-w-[220px] sm:max-w-xs">
                            {item.file.name}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-md ${
                              item.fileType === "png" ? "bg-purple-500/20 text-purple-300" : "bg-cyan-500/20 text-cyan-300"
                            }`}
                          >
                            {item.fileType}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <HardDrive className="w-3 h-3 text-slate-500" />
                            {formatBytes(item.file.size)}
                          </span>
                          {item.nodeCount !== null && (
                            <span className="flex items-center gap-1">
                              <Cpu className="w-3 h-3 text-emerald-400" />
                              ~{item.nodeCount} nodos
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.status === "uploading" && (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded-lg text-[11px]">
                          <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                          <span>Subiendo...</span>
                        </div>
                      )}
                      {item.status === "success" && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Completado</span>
                        </div>
                      )}
                      {item.status === "error" && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-rose-500/10 text-rose-400 rounded-lg text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Error</span>
                        </div>
                      )}

                      {!loading && (
                        <button
                          type="button"
                          onClick={() => removeFileFromQueue(item.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
                          title="Quitar de la cola"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Form fields per queued file */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-900">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Nombre de la Red / Imagen <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateQueuedFile(item.id, "name", e.target.value)}
                        placeholder="Nombre descriptivo"
                        disabled={loading}
                        required
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Descripción / Notas (opcional)
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateQueuedFile(item.id, "description", e.target.value)}
                        placeholder="Descripción o notas..."
                        disabled={loading}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  {item.errorMsg && (
                    <p className="text-[11px] text-rose-400 mt-2 font-medium">
                      ⚠️ {item.errorMsg}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Global Status Messages */}
        {error && (
          <div className="flex items-center gap-2 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Submit Button */}
        {queuedFiles.length > 0 && (
          <div className="flex items-center justify-between pt-2">
            {uploadProgress ? (
              <span className="text-xs text-cyan-400 font-medium">
                Procesando {uploadProgress.current} de {uploadProgress.total} archivos...
              </span>
            ) : (
              <span className="text-xs text-slate-400">
                {queuedFiles.length} {queuedFiles.length === 1 ? "archivo listo" : "archivos listos"} para subir
              </span>
            )}

            <button
              type="submit"
              disabled={loading || queuedFiles.some((f) => !f.name.trim())}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-cyan-500/20"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Cargando Lote ({uploadProgress?.current || 1}/{uploadProgress?.total || queuedFiles.length})...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Guardar y Publicar Archivos ({queuedFiles.length})</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

