"use client";

import { useState, useRef } from "react";
import { Upload, FileCode2, ImageIcon, CheckCircle2, AlertCircle, Sparkles, X, HardDrive, Cpu, Folder } from "lucide-react";
import { Folder as FolderType } from "@/lib/db/schema";
import { formatBytes, parsePyVisStats } from "@/lib/utils";

interface UploadDropzoneProps {
  adminKey: string;
  folders: FolderType[];
  currentFolderId?: string | null;
  onSuccess: () => void;
}

export default function UploadDropzone({
  adminKey,
  folders,
  currentFolderId,
  onSuccess,
}: UploadDropzoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [content, setContent] = useState<string>("");
  const [fileType, setFileType] = useState<"html" | "png">("html");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string>(currentFolderId || "");

  const [parsedStats, setParsedStats] = useState<{ nodeCount: number | null; edgeCount: number | null }>({
    nodeCount: null,
    edgeCount: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processSelectedFile = (selectedFile: File) => {
    const isHtml = selectedFile.name.toLowerCase().endsWith(".html");
    const isPng = selectedFile.name.toLowerCase().endsWith(".png");

    if (!isHtml && !isPng) {
      setError("Por favor, selecciona un archivo HTML de PyVis (.html) o una imagen PNG (.png).");
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setFile(selectedFile);

    const type = isPng ? "png" : "html";
    setFileType(type);

    // Auto-generate name from filename
    const autoName = selectedFile.name
      .replace(/\.(html|png)$/i, "")
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
    
    setName(autoName);

    const reader = new FileReader();
    if (isPng) {
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setContent(dataUrl || "");
        setParsedStats({ nodeCount: null, edgeCount: null });
      };
      reader.readAsDataURL(selectedFile);
    } else {
      reader.onload = (e) => {
        const textContent = e.target?.result as string;
        setContent(textContent || "");
        const stats = parsePyVisStats(textContent || "");
        setParsedStats(stats);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const clearSelectedFile = () => {
    setFile(null);
    setContent("");
    setName("");
    setDescription("");
    setError(null);
    setParsedStats({ nodeCount: null, edgeCount: null });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !content || !name.trim()) {
      setError("Por favor completa los campos requeridos y selecciona un archivo.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          folderId: selectedFolderId || null,
          name: name.trim(),
          description: description.trim() || undefined,
          fileType,
          content,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al subir el archivo.");
      }

      setSuccessMsg(`¡El archivo "${data.name}" se cargó exitosamente!`);
      clearSelectedFile();
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Error al subir el archivo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl shadow-cyan-500/5">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Cargar Nuevo Archivo (HTML o PNG)</h3>
            <p className="text-xs text-slate-400">Sube redes interactivas (.html) o diagramas de imágenes (.png)</p>
          </div>
        </div>

        <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-full text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          Rol Administrador
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Destination Folder Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Carpeta de Destino
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
        {!file ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
              isDragging
                ? "border-cyan-400 bg-cyan-500/10 scale-[1.01]"
                : "border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.png"
              onChange={handleFileChange}
              className="hidden"
            />
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
            <p className="text-xs text-slate-500">Soporta grafos interactivos de PyVis y diagramas PNG</p>
          </div>
        ) : (
          /* File Selected Preview Badge */
          <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2.5 rounded-xl border ${fileType === "png" ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"}`}>
                {fileType === "png" ? <ImageIcon className="w-5 h-5" /> : <FileCode2 className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white truncate">{file.name}</p>
                  <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded-md ${fileType === "png" ? "bg-purple-500/20 text-purple-300" : "bg-cyan-500/20 text-cyan-300"}`}>
                    {fileType}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3 h-3 text-slate-500" />
                    {formatBytes(file.size)}
                  </span>
                  {parsedStats.nodeCount !== null && (
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-emerald-400" />
                      ~{parsedStats.nodeCount} nodos
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={clearSelectedFile}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Fields */}
        {file && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nombre del Grafico / Red <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej: Red 1 - Carga Cognitiva"
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Descripción / Notas
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ej: Diagrama de transiciones de mirada"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        )}

        {/* Status Messages */}
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
        {file && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-slate-950 font-semibold rounded-xl text-xs transition-all shadow-lg shadow-cyan-500/20"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Guardar y Publicar Archivo</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
