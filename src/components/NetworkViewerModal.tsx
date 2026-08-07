"use client";

import { useState, useRef } from "react";
import { X, Maximize2, Minimize2, ExternalLink, Download, RefreshCw, Layers, Cpu, HardDrive } from "lucide-react";
import { NetworkMetadata } from "@/lib/db/schema";
import { formatBytes, formatDate } from "@/lib/utils";

interface NetworkViewerModalProps {
  network: NetworkMetadata | null;
  onClose: () => void;
}

export default function NetworkViewerModal({ network, onClose }: NetworkViewerModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (!network) return null;

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/networks/${network.id}/html`);
      const htmlText = await res.text();
      const blob = new Blob([htmlText], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${network.name.toLowerCase().replace(/\s+/g, "_")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al descargar el archivo HTML:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-2 sm:p-6 animate-in fade-in duration-200">
      <div
        className={`relative flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden transition-all duration-300 ${
          isFullscreen ? "w-full h-full rounded-none border-0 p-0" : "w-full max-w-6xl h-[90vh]"
        }`}
      >
        {/* Header Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl text-cyan-400 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-white truncate">{network.name}</h2>
              <p className="text-xs text-slate-400 truncate">{formatDate(network.createdAt)}</p>
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="hidden md:flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs text-slate-300">
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              {formatBytes(network.fileSizeBytes)}
            </span>
            {network.nodeCount !== null && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                {network.nodeCount} Nodos
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRefresh}
              title="Reiniciar vista / física"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Reiniciar</span>
            </button>

            <button
              onClick={handleDownload}
              title="Descargar archivo HTML original"
              className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors text-xs flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Descargar</span>
            </button>

            <a
              href={`/networks/${network.id}`}
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

        {/* Interactive PyVis Iframe Container */}
        <div className="relative flex-1 w-full bg-slate-950 overflow-hidden">
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={`/api/networks/${network.id}/html`}
            title={network.name}
            className="w-full h-full border-0"
            allow="fullscreen"
          />
        </div>
      </div>
    </div>
  );
}
