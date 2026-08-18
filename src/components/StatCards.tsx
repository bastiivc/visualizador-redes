"use client";

import { Layers, HardDrive, Cpu, Database, FileCode2, ImageIcon } from "lucide-react";
import { FileMetadata } from "@/lib/db/schema";
import { formatBytes } from "@/lib/utils";

interface StatCardsProps {
  networks: FileMetadata[];
}

export default function StatCards({ networks }: StatCardsProps) {
  const totalFiles = networks.length;
  const htmlCount = networks.filter((f) => f.fileType === "html").length;
  const pngCount = networks.filter((f) => f.fileType === "png").length;

  const totalStorageBytes = networks.reduce((acc, n) => acc + (n.fileSizeBytes || 0), 0);
  const totalNodes = networks
    .filter((f) => f.fileType === "html")
    .reduce((acc, n) => acc + (n.nodeCount || 0), 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Files (HTML + PNG breakdown) */}
      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-lg transition-colors">
        <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-500 dark:text-cyan-400">
          <Layers className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Archivos en Repositorio</p>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{totalFiles}</h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            <span className="text-cyan-600 dark:text-cyan-400">{htmlCount} Redes PyVis</span> • <span className="text-purple-600 dark:text-purple-400">{pngCount} Imágenes PNG</span>
          </p>
        </div>
      </div>

      {/* Storage Used */}
      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-lg transition-colors">
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-500 dark:text-blue-400">
          <HardDrive className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Almacenamiento Total</p>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{formatBytes(totalStorageBytes)}</h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Espacio usado en Supabase / DB</p>
        </div>
      </div>

      {/* PyVis Nodes */}
      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-lg transition-colors">
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 dark:text-emerald-400">
          <Cpu className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Nodos PyVis Detectados</p>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{totalNodes}</h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Nodos en redes interactivas</p>
        </div>
      </div>

      {/* Database Status */}
      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-lg transition-colors">
        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-500 dark:text-purple-400">
          <Database className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Motor de Datos</p>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            Neon Postgres / Orm
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Supabase Storage Activo</p>
        </div>
      </div>
    </div>
  );
}
