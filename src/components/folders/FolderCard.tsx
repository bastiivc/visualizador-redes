"use client";

import { useState } from "react";
import { Folder, FileCode2, Edit3, Trash2, ChevronRight, Download, Loader2 } from "lucide-react";
import { FolderWithStats } from "@/lib/db/schema";
import { formatDate } from "@/lib/utils";
import { downloadFolderAsZip } from "@/lib/zipUtils";

interface FolderCardProps {
  folder: FolderWithStats;
  onClick: (folder: FolderWithStats) => void;
  onEdit?: (folder: FolderWithStats) => void;
  onDelete?: (folder: FolderWithStats) => void;
  isAdmin?: boolean;
}

export default function FolderCard({ folder, onClick, onEdit, onDelete, isAdmin }: FolderCardProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadZip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      await downloadFolderAsZip(folder.id, folder.name);
    } catch (err) {
      console.error("Error al descargar carpeta:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      onClick={() => onClick(folder)}
      className="group relative flex flex-col bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 shadow-lg hover:shadow-2xl hover:shadow-cyan-500/10 cursor-pointer transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-2xl text-cyan-400 group-hover:scale-105 transition-transform">
            <Folder className="w-6 h-6 fill-cyan-500/20" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
              {folder.name}
            </h3>
            <p className="text-[11px] text-slate-400">Creada el {formatDate(folder.createdAt)}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleDownloadZip}
            disabled={downloading}
            title="Descargar carpeta completa (.zip)"
            className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-colors disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>

          {isAdmin && (
            <>
              {onEdit && (
                <button
                  onClick={() => onEdit(folder)}
                  title="Editar Carpeta"
                  className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(folder)}
                  title="Eliminar Carpeta"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px] mb-4">
        {folder.description || "Sin descripción asignada."}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
        <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-slate-300">
          <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
          {folder.fileCount || 0} archivos
        </span>

        <span className="flex items-center gap-1 text-cyan-400 font-medium text-xs group-hover:translate-x-1 transition-transform">
          Abrir carpeta
          <ChevronRight className="w-4 h-4" />
        </span>
      </div>
    </div>
  );
}
