"use client";

import { useState } from "react";
import { Home, ChevronRight, Folder, Download, Loader2 } from "lucide-react";
import { Folder as FolderType } from "@/lib/db/schema";
import { downloadFolderAsZip } from "@/lib/zipUtils";

interface FolderBreadcrumbsProps {
  currentFolder: FolderType | null;
  onNavigateHome: () => void;
}

export default function FolderBreadcrumbs({ currentFolder, onNavigateHome }: FolderBreadcrumbsProps) {
  const [downloading, setDownloading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleDownloadFolder = async () => {
    if (!currentFolder) return;
    setDownloading(true);
    try {
      await downloadFolderAsZip(currentFolder.id, currentFolder.name, (msg) => setStatusMsg(msg));
    } catch (err) {
      console.error("Error al descargar carpeta:", err);
    } finally {
      setDownloading(false);
      setStatusMsg(null);
    }
  };

  return (
    <nav className="flex items-center justify-between gap-2 text-xs font-medium text-slate-400 mb-6 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5">
      <div className="flex items-center gap-2 truncate">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-1.5 hover:text-white transition-colors shrink-0"
        >
          <Home className="w-4 h-4 text-cyan-400" />
          <span>Repositorio Principal</span>
        </button>

        {currentFolder && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold truncate">
              <Folder className="w-4 h-4 shrink-0" />
              <span className="truncate">{currentFolder.name}</span>
            </div>
          </>
        )}
      </div>

      {currentFolder && (
        <button
          onClick={handleDownloadFolder}
          disabled={downloading}
          className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-medium transition-colors shrink-0 disabled:opacity-50"
        >
          {downloading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{statusMsg || "Descargando ZIP..."}</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Carpeta (.zip)</span>
            </>
          )}
        </button>
      )}
    </nav>
  );
}
