"use client";

import { useState } from "react";
import { Eye, Download, Trash2, Calendar, HardDrive, Cpu, Share2, Check, FileCode2, ImageIcon, Edit3 } from "lucide-react";
import { FileMetadata } from "@/lib/db/schema";
import { formatBytes, formatDate } from "@/lib/utils";

interface FileCardProps {
  file: FileMetadata;
  onView: (file: FileMetadata) => void;
  onEdit?: (file: FileMetadata) => void;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

export default function FileCard({ file, onView, onEdit, onDelete, isAdmin }: FileCardProps) {
  const [copied, setCopied] = useState(false);
  const isPng = file.fileType === "png";

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/files/${file.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
    <div className="group relative flex flex-col bg-slate-900/90 border border-slate-800/80 hover:border-cyan-500/50 rounded-2xl p-5 shadow-lg hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300">
      {/* Decorative Canvas Preview Header */}
      <div className="relative w-full h-28 bg-slate-950 rounded-xl overflow-hidden mb-4 border border-slate-800/60 flex items-center justify-center group-hover:border-cyan-500/30 transition-colors">
        <div className={`absolute inset-0 bg-gradient-to-br ${isPng ? "from-purple-500/10 via-pink-500/5" : "from-cyan-500/10 via-blue-500/5"} to-transparent opacity-60 group-hover:opacity-100 transition-opacity`} />
        
        {/* Format Specific Graphic Mock */}
        {isPng ? (
          <div className="relative flex flex-col items-center justify-center opacity-80 group-hover:scale-105 transition-transform">
            <ImageIcon className="w-10 h-10 text-purple-400 mb-1" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-purple-300">Imagen PNG</span>
          </div>
        ) : (
          <div className="relative flex items-center justify-center gap-6 opacity-75 group-hover:scale-105 transition-transform duration-300">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 text-xs font-bold shadow-lg shadow-cyan-500/20">
              N1
            </div>
            <div className="w-10 h-0.5 bg-gradient-to-r from-cyan-400/60 to-indigo-400/60" />
            <div className="w-9 h-9 rounded-full bg-indigo-500/20 border-2 border-indigo-400 flex items-center justify-center text-indigo-300 text-xs font-bold">
              N2
            </div>
          </div>
        )}

        {/* Format Badge Pill */}
        <span className={`absolute top-2.5 right-2.5 px-2 py-0.5 text-[10px] font-bold uppercase rounded-md shadow-md ${isPng ? "bg-purple-500/20 border border-purple-500/30 text-purple-300" : "bg-cyan-500/20 border border-cyan-500/30 text-cyan-300"}`}>
          {isPng ? "PNG" : "PyVis HTML"}
        </span>

        {/* Floating Hover Overlay Action */}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
          <button
            onClick={() => onView(file)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-cyan-500/30 transition-transform active:scale-95"
          >
            <Eye className="w-4 h-4" />
            <span>Visualizar</span>
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-white group-hover:text-cyan-400 transition-colors truncate mb-1" title={file.name}>
          {file.name}
        </h3>
        <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px] mb-3">
          {file.description || "Sin descripción."}
        </p>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
          <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-300">
            <Calendar className="w-3 h-3 text-slate-500" />
            {formatDate(file.createdAt)}
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-300">
            <HardDrive className="w-3 h-3 text-cyan-400" />
            {formatBytes(file.fileSizeBytes)}
          </span>
          {file.nodeCount !== null && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-300">
              <Cpu className="w-3 h-3 text-emerald-400" />
              {file.nodeCount} nodos
            </span>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
        <button
          onClick={() => onView(file)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-medium rounded-xl transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Visualizar</span>
        </button>

        <div className="flex items-center gap-1">
          {isAdmin && onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(file);
              }}
              title="Editar archivo (Admin)"
              className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleCopyLink}
            title="Copiar enlace"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleDownload}
            title="Descargar"
            className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {isAdmin && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(file.id);
              }}
              title="Eliminar (Admin)"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
