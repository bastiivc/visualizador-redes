import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function formatDate(dateInput: Date | string): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "Fecha no disponible";
  
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Attempts to estimate node and edge count from PyVis HTML file strings.
 */
export function parsePyVisStats(htmlString: string): { nodeCount: number | null; edgeCount: number | null } {
  try {
    let nodeCount: number | null = null;
    let edgeCount: number | null = null;

    const nodesMatch = htmlString.match(/nodes\s*=\s*new\s*vis\.DataSet\(\s*(\[[\s\S]*?\])\s*\)/i);
    if (nodesMatch && nodesMatch[1]) {
      const matches = nodesMatch[1].match(/\{[\s\S]*?\}/g);
      if (matches) nodeCount = matches.length;
    }

    const edgesMatch = htmlString.match(/edges\s*=\s*new\s*vis\.DataSet\(\s*(\[[\s\S]*?\])\s*\)/i);
    if (edgesMatch && edgesMatch[1]) {
      const matches = edgesMatch[1].match(/\{[\s\S]*?\}/g);
      if (matches) edgeCount = matches.length;
    }

    return { nodeCount, edgeCount };
  } catch (err) {
    return { nodeCount: null, edgeCount: null };
  }
}
