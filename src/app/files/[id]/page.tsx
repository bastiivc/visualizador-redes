import { Metadata } from "next";
import { getFileById } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Layers, ImageIcon } from "lucide-react";
import { formatDate, formatBytes } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const fileRecord = await getFileById(id);
  if (!fileRecord) return { title: "Archivo no encontrado - Redes PUCV" };
  return {
    title: `${fileRecord.name} - Redes PUCV`,
    description: fileRecord.description || "Visualizador de grafos y diagramas",
  };
}

export default async function FileStandalonePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fileRecord = await getFileById(id);

  if (!fileRecord) {
    notFound();
  }

  const isPng = fileRecord.fileType === "png";

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
            <div className={`p-2 border rounded-xl ${isPng ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"}`}>
              {isPng ? <ImageIcon className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
            </div>
            <div>
              <h1 className="text-base font-bold text-white">{fileRecord.name}</h1>
              <p className="text-xs text-slate-400">
                {formatDate(fileRecord.createdAt)} • {formatBytes(fileRecord.fileSizeBytes)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`/api/files/${fileRecord.id}/content`}
            target="_blank"
            download={`${fileRecord.name.toLowerCase().replace(/\s+/g, "_")}.${isPng ? "png" : "html"}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-medium rounded-xl text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Archivo</span>
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full h-full bg-slate-950 overflow-auto flex items-center justify-center p-4">
        {isPng ? (
          <img
            src={`/api/files/${fileRecord.id}/content`}
            alt={fileRecord.name}
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl border border-slate-800"
          />
        ) : (
          <iframe
            src={`/api/files/${fileRecord.id}/content`}
            title={fileRecord.name}
            className="w-full h-full border-0"
            allow="fullscreen"
          />
        )}
      </main>
    </div>
  );
}
