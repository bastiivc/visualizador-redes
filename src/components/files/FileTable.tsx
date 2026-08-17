"use client";

import { useState } from "react";
import { Eye, Download, Trash2, Calendar, HardDrive, Cpu, Share2, Check, FileCode2, ImageIcon, Edit3 } from "lucide-react";
import { FileMetadata } from "@/lib/db/schema";
import { formatBytes, formatDate } from "@/lib/utils";

import HoverMarquee from "@/components/common/HoverMarquee";
import { Folder } from "lucide-react";

interface FileTableProps {
  files: FileMetadata[];
  folderMap?: Record<string, string>;
  onView: (file: FileMetadata) => void;
  onEdit?: (file: FileMetadata) => void;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

export default function FileTable({ files, folderMap, onView, onEdit, onDelete, isAdmin }: FileTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/files/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = async (file: FileMetadata) => {
    try {
      const res = await fetch(`/api/files/${file.id}/content`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${file.name.toLowerCase().replace(/\s+/g, "_")}.${file.fileType === "png" ? "png" : "html"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al descargar:", err);
    }
  };

  if (files.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
        <p className="text-sm text-slate-400">No hay archivos guardados en esta ubicación.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4 font-semibold">Tipo</th>
              <th className="py-3.5 px-4 font-semibold">Nombre del Archivo</th>
              <th className="py-3.5 px-4 font-semibold hidden md:table-cell">Fecha de Subida</th>
              <th className="py-3.5 px-4 font-semibold hidden sm:table-cell">Tamaño</th>
              <th className="py-3.5 px-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {files.map((file) => {
              const isPng = file.fileType === "png";
              const folderName = file.folderId && folderMap ? folderMap[file.folderId] : null;
              return (
                <tr key={file.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold uppercase rounded-md ${isPng ? "bg-purple-500/10 border border-purple-500/20 text-purple-400" : "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400"}`}>
                      {isPng ? <ImageIcon className="w-3.5 h-3.5" /> : <FileCode2 className="w-3.5 h-3.5" />}
                      <span>{isPng ? "PNG" : "HTML"}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-4 max-w-xs">
                    {folderName && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20 mb-0.5">
                        <Folder className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[120px]">{folderName}</span>
                      </span>
                    )}
                    <div className="font-medium text-white group-hover:text-cyan-400 transition-colors">
                      <HoverMarquee text={file.name} />
                    </div>
                    {file.description && (
                      <div className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">{file.description}</div>
                    )}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{formatDate(file.createdAt)}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 hidden sm:table-cell">
                    <div className="flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{formatBytes(file.fileSizeBytes)}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onView(file)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-medium rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Visualizar</span>
                      </button>

                      {isAdmin && onEdit && (
                        <button
                          onClick={() => onEdit(file)}
                          title="Editar archivo (Admin)"
                          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleCopyLink(file.id)}
                        title="Copiar enlace"
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        {copiedId === file.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => handleDownload(file)}
                        title="Descargar"
                        className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {isAdmin && onDelete && (
                        <button
                          onClick={() => onDelete(file.id)}
                          title="Eliminar (Admin)"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors ml-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
