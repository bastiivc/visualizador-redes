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

    // Fast and safe search for nodes DataSet
    const nodesIndex = htmlString.search(/nodes\s*=\s*new\s*vis\.DataSet/i);
    if (nodesIndex !== -1) {
      const sample = htmlString.slice(nodesIndex, nodesIndex + 500000);
      const openBracket = sample.indexOf("[");
      const closeBracket = sample.indexOf("]");
      if (openBracket !== -1 && closeBracket > openBracket) {
        const nodesContent = sample.slice(openBracket, closeBracket);
        const matches = nodesContent.match(/id\s*:/g);
        if (matches) nodeCount = matches.length;
      }
    }

    // Fast and safe search for edges DataSet
    const edgesIndex = htmlString.search(/edges\s*=\s*new\s*vis\.DataSet/i);
    if (edgesIndex !== -1) {
      const sample = htmlString.slice(edgesIndex, edgesIndex + 500000);
      const openBracket = sample.indexOf("[");
      const closeBracket = sample.indexOf("]");
      if (openBracket !== -1 && closeBracket > openBracket) {
        const edgesContent = sample.slice(openBracket, closeBracket);
        const matches = edgesContent.match(/from\s*:/g);
        if (matches) edgeCount = matches.length;
      }
    }

    return { nodeCount, edgeCount };
  } catch (err) {
    return { nodeCount: null, edgeCount: null };
  }
}
