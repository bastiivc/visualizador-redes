"use client";

import { useState } from "react";
import { X, Maximize2, Minimize2, ExternalLink, Download, RefreshCw, Layers, Cpu, HardDrive, ImageIcon, ZoomIn, ZoomOut } from "lucide-react";
import { FileMetadata } from "@/lib/db/schema";
import { formatBytes, formatDate } from "@/lib/utils";

interface FileViewerModalProps {
  file: FileMetadata | null;
  onClose: () => void;
}

export default function FileViewerModal({ file, onClose }: FileViewerModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [iframeKey, setIframeKey] = useState(0);

  if (!file) return null;

  const isPng = file.fileType === "png";

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
    setZoomLevel(1);
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/files/${file.id}/content`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${file.name.toLowerCase().replace(/\s+/g, "_")}.${isPng ? "png" : "html"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al descargar:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-2 sm:p-6 animate-in fade-in duration-200">
      <div
        className={`relative flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isFullscreen ? "w-full h-full rounded-none border-0 p-0" : "w-full max-w-6xl h-[90vh]"
        }`}
      >
        {/* Header Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 border rounded-xl shrink-0 ${isPng ? "bg-purple-500/20 border-purple-500/30 text-purple-400" : "bg-cyan-500/20 border-cyan-500/30 text-cyan-400"}`}>
              {isPng ? <ImageIcon className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white truncate">{file.name}</h2>
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${isPng ? "bg-purple-500/20 text-purple-300" : "bg-cyan-500/20 text-cyan-300"}`}>
                  {isPng ? "Imagen PNG" : "PyVis HTML"}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">{formatDate(file.createdAt)}</p>
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="hidden md:flex items-center gap-2">
            {file.fileSizeBytes > 10 * 1024 * 1024 && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-[11px] font-semibold">
                ⚡ Archivo Pesado (Streaming)
              </span>
            )}
            <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs text-slate-300">
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              {formatBytes(file.fileSizeBytes)}
            </span>
            {file.nodeCount !== null && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                {file.nodeCount} Nodos
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {isPng && (
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 mr-2">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                  title="Alejar zoom"
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[11px] text-slate-300 font-mono px-1">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                  title="Acercar zoom"
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={handleRefresh}
              title="Reiniciar vista"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Reiniciar</span>
            </button>

            <button
              onClick={handleDownload}
              title="Descargar archivo"
              className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors text-xs flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Descargar</span>
            </button>

            <a
              href={`/files/${file.id}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir en pestaña nueva"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Pantalla Completa</span>
            </a>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Restaurar tamaño" : "Expandir modal"}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              title="Cerrar visor"
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content View Container */}
        <div className="relative flex-1 w-full bg-slate-950 overflow-auto flex items-center justify-center p-4">
          {isPng ? (
            <div className="flex items-center justify-center min-w-full min-h-full transition-transform duration-200" style={{ transform: `scale(${zoomLevel})` }}>
              {/* Image Preview */}
              <img
                src={`/api/files/${file.id}/content`}
                alt={file.name}
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl border border-slate-800/80"
              />
            </div>
          ) : (
            <iframe
              key={iframeKey}
              src={`/api/files/${file.id}/content`}
              title={file.name}
              className="w-full h-full border-0"
              allow="fullscreen"
            />
          )}
        </div>
      </div>
    </div>
  );
}
