"use client";

import { useState } from "react";
import { Eye, Download, Trash2, Calendar, HardDrive, Cpu, Share2, Check } from "lucide-react";
import { NetworkMetadata } from "@/lib/db/schema";
import { formatBytes, formatDate } from "@/lib/utils";

interface NetworkTableProps {
  networks: NetworkMetadata[];
  onView: (network: NetworkMetadata) => void;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

export default function NetworkTable({ networks, onView, onDelete, isAdmin }: NetworkTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/networks/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/networks/${id}/html`);
      const htmlText = await res.text();
      const blob = new Blob([htmlText], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name.toLowerCase().replace(/\s+/g, "_")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al descargar:", err);
    }
  };

  if (networks.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
        <p className="text-sm text-slate-400">No hay redes registradas para mostrar.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4 font-semibold">Nombre de la Red</th>
              <th className="py-3.5 px-4 font-semibold hidden md:table-cell">Fecha de Subida</th>
              <th className="py-3.5 px-4 font-semibold hidden sm:table-cell">Tamaño</th>
              <th className="py-3.5 px-4 font-semibold hidden lg:table-cell">Estructura</th>
              <th className="py-3.5 px-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {networks.map((net) => (
              <tr key={net.id} className="hover:bg-slate-800/40 transition-colors group">
                <td className="py-3.5 px-4">
                  <div className="font-medium text-white group-hover:text-cyan-400 transition-colors">{net.name}</div>
                  {net.description && (
                    <div className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">{net.description}</div>
                  )}
                </td>

                <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 hidden md:table-cell">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{formatDate(net.createdAt)}</span>
                  </div>
                </td>

                <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 hidden sm:table-cell">
                  <div className="flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{formatBytes(net.fileSizeBytes)}</span>
                  </div>
                </td>

                <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 hidden lg:table-cell">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{net.nodeCount !== null ? `${net.nodeCount} Nodos` : "Variable"}</span>
                  </div>
                </td>

                <td className="py-3.5 px-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onView(net)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-medium rounded-lg transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Visualizar</span>
                    </button>

                    <button
                      onClick={() => handleCopyLink(net.id)}
                      title="Copiar enlace"
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      {copiedId === net.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handleDownload(net.id, net.name)}
                      title="Descargar HTML"
                      className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {isAdmin && onDelete && (
                      <button
                        onClick={() => onDelete(net.id)}
                        title="Eliminar red (Admin)"
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors ml-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
