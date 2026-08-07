"use client";

import { Layers, HardDrive, Cpu, Database } from "lucide-react";
import { NetworkMetadata } from "@/lib/db/schema";
import { formatBytes } from "@/lib/utils";

interface StatCardsProps {
  networks: NetworkMetadata[];
}

export default function StatCards({ networks }: StatCardsProps) {
  const totalNetworks = networks.length;
  const totalStorageBytes = networks.reduce((acc, n) => acc + (n.fileSizeBytes || 0), 0);
  const totalNodes = networks.reduce((acc, n) => acc + (n.nodeCount || 0), 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Networks */}
      <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
          <Layers className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400">Redes Almacenadas</p>
          <h3 className="text-xl font-bold text-white mt-0.5">{totalNetworks}</h3>
        </div>
      </div>

      {/* Storage Used */}
      <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
          <HardDrive className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400">Almacenamiento Total</p>
          <h3 className="text-xl font-bold text-white mt-0.5">{formatBytes(totalStorageBytes)}</h3>
        </div>
      </div>

      {/* Estimated Nodes */}
      <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
          <Cpu className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400">Nodos Detectados</p>
          <h3 className="text-xl font-bold text-white mt-0.5">{totalNodes}</h3>
        </div>
      </div>

      {/* Database Status */}
      <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
          <Database className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400">Motor de Datos</p>
          <h3 className="text-sm font-semibold text-white mt-0.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Neon Postgres / Orm
          </h3>
        </div>
      </div>
    </div>
  );
}
