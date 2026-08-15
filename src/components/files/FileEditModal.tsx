"use client";

import { useState, useEffect, useRef } from "react";
import { Edit3, X, CheckCircle2, AlertCircle, Upload, FileCode2, ImageIcon, Folder, HardDrive } from "lucide-react";
import { FileMetadata, Folder as FolderType } from "@/lib/db/schema";
import { formatBytes, parsePyVisStats } from "@/lib/utils";

interface FileEditModalProps {
  isOpen: boolean;
  fileToEdit: FileMetadata | null;
  folders: FolderType[];
  adminKey: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FileEditModal({
  isOpen,
  fileToEdit,
  folders,
  adminKey,
  onClose,
  onSuccess,
}: FileEditModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [folderId, setFolderId] = useState<string>("");
  
  // File replacement state
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [replacementContent, setReplacementContent] = useState<string | null>(null);
  const [replacementFileType, setReplacementFileType] = useState<string>("html");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (fileToEdit) {
      setName(fileToEdit.name);
      setDescription(fileToEdit.description || "");
      setFolderId(fileToEdit.folderId || "");
      setReplacementFile(null);
      setReplacementContent(null);
    }
    setError(null);
  }, [fileToEdit, isOpen]);

  if (!isOpen || !fileToEdit) return null;

  const handleReplacementFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const isHtml = selected.name.toLowerCase().endsWith(".html");
      const isPng = selected.name.toLowerCase().endsWith(".png");

      if (!isHtml && !isPng) {
        setError("Solo se permiten archivos .html de PyVis o imágenes .png.");
        return;
      }

      setError(null);
      setReplacementFile(selected);
      const fileType = isPng ? "png" : "html";
      setReplacementFileType(fileType);

      const reader = new FileReader();
      if (isPng) {
        reader.onload = (ev) => {
          setReplacementContent((ev.target?.result as string) || null);
        };
        reader.readAsDataURL(selected);
      } else {
        reader.onload = (ev) => {
          setReplacementContent((ev.target?.result as string) || null);
        };
        reader.readAsText(selected);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre del archivo es obligatorio.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const bodyPayload: any = {
        name: name.trim(),
        description: description.trim() || undefined,
        folderId: folderId || null,
      };

      if (replacementContent) {
        bodyPayload.content = replacementContent;
        bodyPayload.fileType = replacementFileType;
      }

      const res = await fetch(`/api/files/${fileToEdit.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al actualizar el archivo.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al guardar los cambios.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
            <Edit3 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Editar Archivo</h3>
            <p className="text-xs text-slate-400">Modifica metadatos, cámbialo de carpeta o reemplaza su contenido</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nombre del Archivo <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Carpeta Contenedora
            </label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="">(Sin carpeta - Raíz principal)</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  📁 {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Descripción / Notas
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción opcional..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          {/* Replace Attached File Section */}
          <div className="pt-2 border-t border-slate-800">
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Reemplazar Archivo Adjunto (Opcional)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-between p-3.5 bg-slate-950 border border-dashed border-slate-800 hover:border-cyan-500/50 rounded-xl cursor-pointer transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".html,.png"
                onChange={handleReplacementFileChange}
                className="hidden"
              />
              <div className="flex items-center gap-2.5 min-w-0">
                {replacementFile ? (
                  replacementFileType === "png" ? <ImageIcon className="w-5 h-5 text-purple-400 shrink-0" /> : <FileCode2 className="w-5 h-5 text-cyan-400 shrink-0" />
                ) : (
                  <Upload className="w-5 h-5 text-slate-500 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white truncate">
                    {replacementFile ? replacementFile.name : "Haz clic para seleccionar nuevo .html o .png"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {replacementFile ? formatBytes(replacementFile.size) : "Sustituirá el archivo existente sin borrar el registro"}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 text-[11px] rounded-lg">
                Examinar
              </span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-xl text-xs transition-colors shadow-lg shadow-cyan-500/20"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
