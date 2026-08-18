"use client";

import { useState } from "react";
import { Folder, Calendar, FileCode2, Download, Edit3, Trash2, ChevronRight, Loader2 } from "lucide-react";
import { FolderWithStats } from "@/lib/db/schema";
import { formatDate, formatBytes } from "@/lib/utils";
import { downloadFolderAsZip } from "@/lib/zipUtils";
import HoverMarquee from "@/components/common/HoverMarquee";

interface FolderTableProps {
  folders: FolderWithStats[];
  onClick: (folder: FolderWithStats) => void;
  onEdit?: (folder: FolderWithStats) => void;
  onDelete?: (folder: FolderWithStats) => void;
  isAdmin?: boolean;
}

export default function FolderTable({ folders, onClick, onEdit, onDelete, isAdmin }: FolderTableProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadZip = async (e: React.MouseEvent, folder: FolderWithStats) => {
    e.stopPropagation();
    setDownloadingId(folder.id);
    try {
      await downloadFolderAsZip(folder.id, folder.name);
    } catch (err) {
      console.error("Error al descargar carpeta:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  if (folders.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-md transition-colors">
        <p className="text-sm text-slate-500 dark:text-slate-400">No hay carpetas guardadas en esta ubicación.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md dark:shadow-xl mb-8 transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4 font-semibold">Tipo</th>
              <th className="py-3.5 px-4 font-semibold">Nombre de la Carpeta</th>
              <th className="py-3.5 px-4 font-semibold hidden md:table-cell">Fecha de Creación</th>
              <th className="py-3.5 px-4 font-semibold hidden sm:table-cell">Contenido</th>
              <th className="py-3.5 px-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
            {folders.map((folder) => {
              const isDownloading = downloadingId === folder.id;
              return (
                <tr
                  key={folder.id}
                  onClick={() => onClick(folder)}
                  className="hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                >
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold uppercase rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                      <Folder className="w-3.5 h-3.5 fill-cyan-500/20" />
                      <span>Carpeta</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-medium text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      <HoverMarquee text={folder.name} />
                    </div>
                    {folder.description && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 max-w-xs">{folder.description}</div>
                    )}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{formatDate(folder.createdAt)}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-slate-700 dark:text-slate-300 text-[11px]">
                        <FileCode2 className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                        {folder.fileCount || 0} archivos
                      </span>
                      {folder.totalSizeBytes !== undefined && folder.totalSizeBytes > 0 && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          ({formatBytes(folder.totalSizeBytes)})
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onClick(folder)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-medium rounded-lg transition-colors"
                      >
                        <span>Abrir</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleDownloadZip(e, folder)}
                        disabled={isDownloading}
                        title="Descargar carpeta completa (.zip)"
                        className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isDownloading ? (
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
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors ml-0.5"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
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
