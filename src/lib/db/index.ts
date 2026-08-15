import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, desc, isNull } from "drizzle-orm";
import * as schema from "./schema";
import { Folder, NewFolder, FileRecord, NewFileRecord, FileMetadata, FolderWithStats } from "./schema";

const databaseUrl = process.env.DATABASE_URL;

// Demo PyVis HTML content
const SAMPLE_PYVIS_HTML_1 = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Cognitive Load Network Demo</title>
  <script type="text/javascript" src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
  <style type="text/css">
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: #0f172a; color: #f8fafc; font-family: sans-serif; }
    #mynetwork { width: 100%; height: 100vh; }
    .title-banner { position: absolute; top: 16px; left: 16px; z-index: 10; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px); padding: 10px 18px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); }
  </style>
</head>
<body>
<div class="title-banner">
  <h3 style="margin: 0; font-size: 16px; color: #38bdf8;">Red de Carga Cognitiva - Secuencial</h3>
  <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">PyVis Interactive Graph Demo</p>
</div>
<div id="mynetwork"></div>
<script type="text/javascript">
  const nodes = new vis.DataSet([
    { id: 1, label: "Fijación 1 (AOI_A)", color: "#38bdf8", size: 25 },
    { id: 2, label: "Fijación 2 (AOI_B)", color: "#818cf8", size: 30 },
    { id: 3, label: "Fijación 3 (AOI_C)", color: "#c084fc", size: 20 },
    { id: 4, label: "Pupila Dilatación High", color: "#f43f5e", size: 35 },
    { id: 5, label: "Saccade Rápida", color: "#34d399", size: 18 }
  ]);
  const edges = new vis.DataSet([
    { from: 1, to: 2, label: "0.85", width: 3 },
    { from: 2, to: 3, label: "0.62", width: 2 },
    { from: 2, to: 4, label: "0.94", width: 5 },
    { from: 3, to: 4, label: "0.78", width: 3 },
    { from: 4, to: 5, label: "0.55", width: 2 },
    { from: 5, to: 1, label: "0.40", width: 1 }
  ]);
  const container = document.getElementById("mynetwork");
  new vis.Network(container, { nodes, edges }, { physics: { stabilization: true } });
</script>
</body>
</html>`;

// Demo PNG Image Data URI
const SAMPLE_PNG_DATA_URI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

// In-Memory Folders Store
let inMemoryFolders: Folder[] = [
  {
    id: "f1111111-1111-4111-a111-111111111111",
    name: "Red 1 - Carga Cognitiva",
    description: "Carpeta principal con ensayos de pupila y mapas secuenciales.",
    color: "cyan",
    createdAt: new Date(Date.now() - 3600000 * 48),
    updatedAt: new Date(Date.now() - 3600000 * 48),
  },
  {
    id: "f2222222-2222-4222-a222-222222222222",
    name: "Experimentos Eye-Tracking",
    description: "Gráficos PNG y matrices de transición de miradas Scanpath.",
    color: "purple",
    createdAt: new Date(Date.now() - 3600000 * 24),
    updatedAt: new Date(Date.now() - 3600000 * 24),
  },
];

// In-Memory Files Store
let inMemoryFiles: FileRecord[] = [
  {
    id: "d9b2a1e4-5c8f-4a3b-9e2d-1a8b7c6d5e4f",
    folderId: "f1111111-1111-4111-a111-111111111111",
    name: "Red de Carga Cognitiva - Ensayo 1",
    description: "Análisis de pupila y secuencia de fijaciones en tarea de esfuerzo cognitivo elevado.",
    fileType: "html",
    content: SAMPLE_PYVIS_HTML_1,
    storageKey: null,
    fileSizeBytes: 2150,
    nodeCount: 5,
    edgeCount: 6,
    createdAt: new Date(Date.now() - 3600000 * 24),
    updatedAt: new Date(Date.now() - 3600000 * 24),
  },
  {
    id: "f8c7b6a5-4d3e-2f1a-0b9c-8d7e6f5a4b3c",
    folderId: "f2222222-2222-4222-a222-222222222222",
    name: "Scanpath Network Diagram",
    description: "Gráfico exportado en PNG con el flujo de áreas de interés.",
    fileType: "png",
    content: SAMPLE_PNG_DATA_URI,
    storageKey: null,
    fileSizeBytes: 1840,
    nodeCount: null,
    edgeCount: null,
    createdAt: new Date(Date.now() - 3600000 * 12),
    updatedAt: new Date(Date.now() - 3600000 * 12),
  },
];

function isNeonConfigured(): boolean {
  return typeof databaseUrl === "string" && databaseUrl.trim().startsWith("postgres");
}

let migrationDone = false;
async function ensureSchemaUpdated() {
  if (migrationDone || !isNeonConfigured() || !databaseUrl) return;
  try {
    const sql = neon(databaseUrl);
    await sql`ALTER TABLE files ADD COLUMN IF NOT EXISTS storage_key TEXT;`;
    await sql`ALTER TABLE files ALTER COLUMN content DROP NOT NULL;`;
    migrationDone = true;
  } catch (err) {
    console.warn("Neon DB auto-migration check:", err);
  }
}

function getDrizzleClient() {
  if (!databaseUrl) throw new Error("No DATABASE_URL configured");
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

/* =========================================================================
   FOLDER OPERATIONS
   ========================================================================= */

export async function getFolders(): Promise<FolderWithStats[]> {
  if (isNeonConfigured()) {
    try {
      const db = getDrizzleClient();
      const rows = await db.select().from(schema.folders).orderBy(desc(schema.folders.createdAt));
      
      const allFiles = await db.select({ folderId: schema.files.folderId }).from(schema.files);
      const counts: Record<string, number> = {};
      allFiles.forEach((f) => {
        if (f.folderId) {
          counts[f.folderId] = (counts[f.folderId] || 0) + 1;
        }
      });

      return rows.map((folder) => ({
        ...folder,
        fileCount: counts[folder.id] || 0,
      }));
    } catch (err) {
      console.warn("Neon DB getFolders failed, using fallback:", err);
    }
  }

  return inMemoryFolders
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((folder) => ({
      ...folder,
      fileCount: inMemoryFiles.filter((f) => f.folderId === folder.id).length,
    }));
}

export async function getFolderById(id: string): Promise<Folder | null> {
  if (isNeonConfigured()) {
    try {
      const db = getDrizzleClient();
      const rows = await db.select().from(schema.folders).where(eq(schema.folders.id, id)).limit(1);
      return rows[0] || null;
    } catch (err) {
      console.warn("Neon DB getFolderById failed, using fallback:", err);
    }
  }
  return inMemoryFolders.find((f) => f.id === id) || null;
}

export async function createFolder(data: NewFolder): Promise<Folder> {
  const newId = crypto.randomUUID();
  const now = new Date();

  if (isNeonConfigured()) {
    try {
      const db = getDrizzleClient();
      const [inserted] = await db
        .insert(schema.folders)
        .values({ ...data, id: newId })
        .returning();
      return inserted;
    } catch (err) {
      console.warn("Neon DB createFolder failed, using fallback:", err);
    }
  }

  const record: Folder = {
    id: newId,
    name: data.name,
    description: data.description || null,
    color: data.color || "cyan",
    createdAt: now,
    updatedAt: now,
  };
  inMemoryFolders.unshift(record);
  return record;
}

export async function updateFolder(id: string, data: Partial<NewFolder>): Promise<Folder | null> {
  const now = new Date();

  if (isNeonConfigured()) {
    try {
      const db = getDrizzleClient();
      const [updated] = await db
        .update(schema.folders)
        .set({ ...data, updatedAt: now })
        .where(eq(schema.folders.id, id))
        .returning();
      return updated || null;
    } catch (err) {
      console.warn("Neon DB updateFolder failed, using fallback:", err);
    }
  }

  const index = inMemoryFolders.findIndex((f) => f.id === id);
  if (index === -1) return null;
  inMemoryFolders[index] = {
    ...inMemoryFolders[index],
    ...data,
    updatedAt: now,
  };
  return inMemoryFolders[index];
}

export async function deleteFolder(id: string): Promise<boolean> {
  if (isNeonConfigured()) {
    try {
      const db = getDrizzleClient();
      await db.delete(schema.files).where(eq(schema.files.folderId, id));
      await db.delete(schema.folders).where(eq(schema.folders.id, id));
      return true;
    } catch (err) {
      console.warn("Neon DB deleteFolder failed, using fallback:", err);
    }
  }

  inMemoryFolders = inMemoryFolders.filter((f) => f.id !== id);
  inMemoryFiles = inMemoryFiles.filter((f) => f.folderId !== id);
  return true;
}

/* =========================================================================
   FILE OPERATIONS (.html and .png)
   ========================================================================= */

export async function getFilesList(folderId?: string | null): Promise<FileMetadata[]> {
  if (isNeonConfigured()) {
    try {
      await ensureSchemaUpdated();
      const db = getDrizzleClient();
      const selectFields = {
        id: schema.files.id,
        folderId: schema.files.folderId,
        name: schema.files.name,
        description: schema.files.description,
        fileType: schema.files.fileType,
        fileSizeBytes: schema.files.fileSizeBytes,
        nodeCount: schema.files.nodeCount,
        edgeCount: schema.files.edgeCount,
        createdAt: schema.files.createdAt,
        updatedAt: schema.files.updatedAt,
      };

      if (folderId !== undefined) {
        if (folderId === null || folderId === "root") {
          return await db.select(selectFields).from(schema.files).where(isNull(schema.files.folderId)).orderBy(desc(schema.files.createdAt));
        }
        return await db.select(selectFields).from(schema.files).where(eq(schema.files.folderId, folderId)).orderBy(desc(schema.files.createdAt));
      }

      return await db.select(selectFields).from(schema.files).orderBy(desc(schema.files.createdAt));
    } catch (err) {
      console.warn("Neon DB getFilesList failed, using fallback:", err);
    }
  }

  let filtered = inMemoryFiles.slice();
  if (folderId !== undefined) {
    if (folderId === null || folderId === "root") {
      filtered = filtered.filter((f) => !f.folderId);
    } else {
      filtered = filtered.filter((f) => f.folderId === folderId);
    }
  }

  return filtered
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(({ content, ...meta }) => meta);
}

export async function getFileById(id: string): Promise<FileRecord | null> {
  if (isNeonConfigured()) {
    try {
      await ensureSchemaUpdated();
      const db = getDrizzleClient();
      const rows = await db.select().from(schema.files).where(eq(schema.files.id, id)).limit(1);
      return rows[0] || null;
    } catch (err) {
      console.warn("Neon DB getFileById failed, using fallback:", err);
    }
  }

  return inMemoryFiles.find((f) => f.id === id) || null;
}

export async function createFile(data: NewFileRecord): Promise<FileMetadata> {
  const newId = crypto.randomUUID();
  const now = new Date();

  if (isNeonConfigured()) {
    try {
      const db = getDrizzleClient();
      const [inserted] = await db
        .insert(schema.files)
        .values({
          ...data,
          id: newId,
        })
        .returning({
          id: schema.files.id,
          folderId: schema.files.folderId,
          name: schema.files.name,
          description: schema.files.description,
          fileType: schema.files.fileType,
          fileSizeBytes: schema.files.fileSizeBytes,
          nodeCount: schema.files.nodeCount,
          edgeCount: schema.files.edgeCount,
          createdAt: schema.files.createdAt,
          updatedAt: schema.files.updatedAt,
        });
      return inserted;
    } catch (err) {
      console.warn("Neon DB createFile failed, using fallback:", err);
    }
  }

  const newRecord: FileRecord = {
    id: newId,
    folderId: data.folderId || null,
    name: data.name,
    description: data.description || null,
    fileType: data.fileType || "html",
    content: data.content || null,
    storageKey: data.storageKey || null,
    fileSizeBytes: data.fileSizeBytes,
    nodeCount: data.nodeCount || null,
    edgeCount: data.edgeCount || null,
    createdAt: now,
    updatedAt: now,
  };

  inMemoryFiles.unshift(newRecord);
  const { content, storageKey, ...meta } = newRecord;
  return meta;
}

export async function updateFile(id: string, data: Partial<NewFileRecord>): Promise<FileMetadata | null> {
  const now = new Date();

  if (isNeonConfigured()) {
    try {
      const db = getDrizzleClient();
      const [updated] = await db
        .update(schema.files)
        .set({
          ...data,
          updatedAt: now,
        })
        .where(eq(schema.files.id, id))
        .returning({
          id: schema.files.id,
          folderId: schema.files.folderId,
          name: schema.files.name,
          description: schema.files.description,
          fileType: schema.files.fileType,
          fileSizeBytes: schema.files.fileSizeBytes,
          nodeCount: schema.files.nodeCount,
          edgeCount: schema.files.edgeCount,
          createdAt: schema.files.createdAt,
          updatedAt: schema.files.updatedAt,
        });
      return updated || null;
    } catch (err) {
      console.warn("Neon DB updateFile failed, using fallback:", err);
    }
  }

  const index = inMemoryFiles.findIndex((f) => f.id === id);
  if (index === -1) return null;

  inMemoryFiles[index] = {
    ...inMemoryFiles[index],
    ...data,
    updatedAt: now,
  };

  const { content, storageKey, ...meta } = inMemoryFiles[index];
  return meta;
}

export async function deleteFile(id: string): Promise<boolean> {
  const existing = await getFileById(id);
  if (existing?.storageKey) {
    const { deleteStorageFile } = await import("@/lib/storage");
    await deleteStorageFile(existing.storageKey);
  }

  if (isNeonConfigured()) {
    try {
      const db = getDrizzleClient();
      await db.delete(schema.files).where(eq(schema.files.id, id));
      return true;
    } catch (err) {
      console.warn("Neon DB deleteFile failed, using fallback:", err);
    }
  }

  const initialLen = inMemoryFiles.length;
  inMemoryFiles = inMemoryFiles.filter((f) => f.id !== id);
  return inMemoryFiles.length < initialLen;
}

// Backward-compatibility export aliases
export const getNetworksList = getFilesList;
export const getNetworkById = getFileById;
export const createNetwork = (data: any) => createFile({ ...data, fileType: "html" });
export const deleteNetwork = deleteFile;
