"use client";

import { Home, ChevronRight, Folder } from "lucide-react";
import { Folder as FolderType } from "@/lib/db/schema";

interface FolderBreadcrumbsProps {
  currentFolder: FolderType | null;
  onNavigateHome: () => void;
}

export default function FolderBreadcrumbs({ currentFolder, onNavigateHome }: FolderBreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-6 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5">
      <button
        onClick={onNavigateHome}
        className="flex items-center gap-1.5 hover:text-white transition-colors"
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
    </nav>
  );
}
