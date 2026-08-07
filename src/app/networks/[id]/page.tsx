import { Metadata } from "next";
import { getNetworkById } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Download, Layers } from "lucide-react";
import { formatDate, formatBytes } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const network = await getNetworkById(id);
  if (!network) return { title: "Red no encontrada - PyVis Hub" };
  return {
    title: `${network.name} - Visualizador PyVis`,
    description: network.description || "Visualizador interactivo de grafos exportados por PyVis",
  };
}

export default async function NetworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const network = await getNetworkById(id);

  if (!network) {
    notFound();
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>Volver al Repositorio</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">{network.name}</h1>
              <p className="text-xs text-slate-400">
                {formatDate(network.createdAt)} • {formatBytes(network.fileSizeBytes)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`/api/networks/${network.id}/html`}
            target="_blank"
            download={`${network.name.toLowerCase().replace(/\s+/g, "_")}.html`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-medium rounded-xl text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar HTML</span>
          </a>
        </div>
      </header>

      {/* Standalone Interactive PyVis Iframe */}
      <main className="flex-1 w-full h-full bg-slate-950">
        <iframe
          src={`/api/networks/${network.id}/html`}
          title={network.name}
          className="w-full h-full border-0"
          allow="fullscreen"
        />
      </main>
    </div>
  );
}
