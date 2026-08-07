"use client";

import { useState, useRef } from "react";
import { Upload, FileCode2, CheckCircle2, AlertCircle, Sparkles, X, HardDrive, Cpu } from "lucide-react";
import { formatBytes, parsePyVisStats } from "@/lib/utils";

interface UploadDropzoneProps {
  adminKey: string;
  onSuccess: () => void;
}

export default function UploadDropzone({ adminKey, onSuccess }: UploadDropzoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
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
    if (!selectedFile.name.endsWith(".html") && selectedFile.type !== "text/html") {
      setError("Por favor, selecciona un archivo HTML de PyVis válido (.html).");
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setFile(selectedFile);

    // Auto-generate name from file name
    const autoName = selectedFile.name
      .replace(/\.html$/i, "")
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
    
    setName(autoName);

    // Read HTML content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setHtmlContent(content || "");
      const stats = parsePyVisStats(content || "");
      setParsedStats(stats);
    };
    reader.readAsText(selectedFile);
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
    setHtmlContent("");
    setName("");
    setDescription("");
    setError(null);
    setParsedStats({ nodeCount: null, edgeCount: null });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !htmlContent || !name.trim()) {
      setError("Por favor completa los campos requeridos y selecciona un archivo HTML.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/networks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          htmlContent,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al subir el archivo HTML.");
      }

      setSuccessMsg(`¡La red "${data.name}" se cargó exitosamente!`);
      clearSelectedFile();
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado al procesar la subida.");
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
            <h3 className="text-base font-semibold text-white">Cargar Nueva Red (PyVis HTML)</h3>
            <p className="text-xs text-slate-400">Arrastra o selecciona un archivo .html para agregarlo al repositorio</p>
          </div>
        </div>

        <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-full text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          Rol Administrador
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
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
              accept=".html"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-cyan-400 mb-3 shadow-inner">
              <FileCode2 className="w-8 h-8" />
            </div>
            <p className="text-sm font-medium text-slate-200 mb-1">
              Haz clic para examinar o arrastra tu archivo <span className="text-cyan-400 font-mono">.html</span>
            </p>
            <p className="text-xs text-slate-500">Archivos HTML interactivos exportados directamente de PyVis</p>
          </div>
        ) : (
          /* File Selected Preview Badge */
          <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
                <FileCode2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{file.name}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3 h-3 text-slate-500" />
                    {formatBytes(file.size)}
                  </span>
                  {parsedStats.nodeCount !== null && (
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-emerald-400" />
                      ~{parsedStats.nodeCount} nodos detectados
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
                Nombre de la Red <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej: Red de Carga Cognitiva Trial 1"
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Descripción / Notas (Opcional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ej: Datos de eye-tracking con umbral Z-score = 2.0"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
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
                  <span>Guardar y Publicar Red</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
