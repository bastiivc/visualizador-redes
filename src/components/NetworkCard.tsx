"use client";

import { useState } from "react";
import { Eye, Download, Trash2, Calendar, HardDrive, Cpu, Share2, Check } from "lucide-react";
import { NetworkMetadata } from "@/lib/db/schema";
import { formatBytes, formatDate } from "@/lib/utils";

interface NetworkCardProps {
  network: NetworkMetadata;
  onView: (network: NetworkMetadata) => void;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

export default function NetworkCard({ network, onView, onDelete, isAdmin }: NetworkCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/networks/${network.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
      console.error("Error al descargar archivo:", err);
    }
  };

  return (
    <div className="group relative flex flex-col bg-slate-900/90 border border-slate-800/80 hover:border-cyan-500/50 rounded-2xl p-5 shadow-lg hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300">
      {/* Decorative Network Graph Graphic Canvas Header */}
      <div className="relative w-full h-28 bg-slate-950 rounded-xl overflow-hidden mb-4 border border-slate-800/60 flex items-center justify-center group-hover:border-cyan-500/30 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
        
        {/* Abstract Network Graph Nodes Mock Graphic */}
        <div className="relative flex items-center justify-center gap-6 opacity-75 group-hover:scale-105 transition-transform duration-300">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 text-xs font-bold shadow-lg shadow-cyan-500/20">
              N1
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
          </div>
          <div className="w-12 h-0.5 bg-gradient-to-r from-cyan-400/60 to-indigo-400/60" />
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 border-2 border-indigo-400 flex items-center justify-center text-indigo-300 text-xs font-bold shadow-lg shadow-indigo-500/20">
            N2
          </div>
          <div className="w-8 h-0.5 bg-gradient-to-r from-indigo-400/60 to-purple-400/60" />
          <div className="w-7 h-7 rounded-full bg-purple-500/20 border-2 border-purple-400 flex items-center justify-center text-purple-300 text-xs font-bold">
            N3
          </div>
        </div>

        {/* Floating Quick Action Overlay */}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
          <button
            onClick={() => onView(network)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-cyan-500/30 transition-transform active:scale-95"
          >
            <Eye className="w-4 h-4" />
            <span>Visualizar</span>
          </button>
        </div>
      </div>

      {/* Title & Metadata */}
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-white group-hover:text-cyan-400 transition-colors truncate mb-1" title={network.name}>
          {network.name}
        </h3>
        <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px] mb-3">
          {network.description || "Sin descripción adicional."}
        </p>

        {/* Pills / Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
          <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-300">
            <Calendar className="w-3 h-3 text-slate-500" />
            {formatDate(network.createdAt)}
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-300">
            <HardDrive className="w-3 h-3 text-cyan-400" />
            {formatBytes(network.fileSizeBytes)}
          </span>
          {network.nodeCount !== null && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-300">
              <Cpu className="w-3 h-3 text-emerald-400" />
              {network.nodeCount} nodos
            </span>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
        <button
          onClick={() => onView(network)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-medium rounded-xl transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Visualizar</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopyLink}
            title="Copiar enlace"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleDownload}
            title="Descargar HTML"
            className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {isAdmin && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(network.id);
              }}
              title="Eliminar red (Solo Admin)"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors ml-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
