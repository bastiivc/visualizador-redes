"use client";

import { useState, useEffect } from "react";
import { Folder, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Folder as FolderType } from "@/lib/db/schema";

interface FolderModalProps {
  isOpen: boolean;
  folderToEdit?: FolderType | null;
  parentId?: string | null;
  adminKey: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FolderModal({
  isOpen,
  folderToEdit,
  parentId,
  adminKey,
  onClose,
  onSuccess,
}: FolderModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (folderToEdit) {
      setName(folderToEdit.name);
      setDescription(folderToEdit.description || "");
    } else {
      setName("");
      setDescription("");
    }
    setError(null);
  }, [folderToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre de la carpeta es obligatorio.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = folderToEdit ? `/api/folders/${folderToEdit.id}` : "/api/folders";
      const method = folderToEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          parentId: folderToEdit ? undefined : (parentId || undefined),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al procesar la carpeta.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar la carpeta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
            <Folder className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {folderToEdit ? "Editar Carpeta" : "Nueva Carpeta"}
            </h3>
            <p className="text-xs text-slate-400">
              {folderToEdit ? "Modifica el nombre o descripción de la carpeta" : "Crea una carpeta para organizar tus redes y gráficos"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nombre de la Carpeta <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              placeholder="ej: Red 1 - Carga Cognitiva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Descripción / Notas (Opcional)
            </label>
            <input
              type="text"
              placeholder="ej: Datos de eye-tracking ensayo 1"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
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
                  <span>{folderToEdit ? "Guardar Cambios" : "Crear Carpeta"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
