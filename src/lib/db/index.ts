import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, desc } from "drizzle-orm";
import * as schema from "./schema";
import { NetworkMetadata, Network, NewNetwork } from "./schema";

const databaseUrl = process.env.DATABASE_URL;

// Sample demo networks for out-of-the-box visualizer demonstration
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
    { id: 1, label: "Fijación 1 (AOI_A)", color: "#38bdf8", size: 25, title: "Inicio de tarea visual" },
    { id: 2, label: "Fijación 2 (AOI_B)", color: "#818cf8", size: 30, title: "Procesamiento de estímulo" },
    { id: 3, label: "Fijación 3 (AOI_C)", color: "#c084fc", size: 20, title: "Verificación de hipótesis" },
    { id: 4, label: "Pupila Dilatación High", color: "#f43f5e", size: 35, title: "Alta Carga Cognitiva" },
    { id: 5, label: "Saccade Rápida", color: "#34d399", size: 18, title: "Transición de foco" }
  ]);
  const edges = new vis.DataSet([
    { from: 1, to: 2, label: "0.85", width: 3, color: { color: "#38bdf8" } },
    { from: 2, to: 3, label: "0.62", width: 2, color: { color: "#818cf8" } },
    { from: 2, to: 4, label: "0.94", width: 5, color: { color: "#f43f5e" } },
    { from: 3, to: 4, label: "0.78", width: 3, color: { color: "#c084fc" } },
    { from: 4, to: 5, label: "0.55", width: 2, color: { color: "#34d399" } },
    { from: 5, to: 1, label: "0.40", width: 1, color: { color: "#38bdf8" } }
  ]);
  const container = document.getElementById("mynetwork");
  const data = { nodes: nodes, edges: edges };
  const options = {
    nodes: { shape: "dot", font: { color: "#ffffff", size: 14 } },
    edges: { smooth: { type: "continuous" }, font: { color: "#cbd5e1", size: 11, align: "middle" } },
    physics: { barnesHut: { gravitationalConstant: -3000, centralGravity: 0.3, springLength: 120 } }
  };
  new vis.Network(container, data, options);
</script>
</body>
</html>`;

const SAMPLE_PYVIS_HTML_2 = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Scanpath Network Analysis</title>
  <script type="text/javascript" src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
  <style type="text/css">
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background-color: #090d16; color: #f8fafc; font-family: sans-serif; }
    #mynetwork { width: 100%; height: 100vh; }
  </style>
</head>
<body>
<div id="mynetwork"></div>
<script type="text/javascript">
  const nodes = new vis.DataSet([
    { id: "Header", label: "Área: Encabezado", color: "#fbbf24", size: 28 },
    { id: "Chart", label: "Área: Gráfico Principal", color: "#10b981", size: 40 },
    { id: "Legend", label: "Área: Leyenda", color: "#06b6d4", size: 22 },
    { id: "Footer", label: "Área: Pie de Página", color: "#64748b", size: 18 }
  ]);
  const edges = new vis.DataSet([
    { from: "Header", to: "Chart", label: "14 transiciones", width: 4, arrows: "to" },
    { from: "Chart", to: "Legend", label: "9 transiciones", width: 3, arrows: "to" },
    { from: "Legend", to: "Chart", label: "7 transiciones", width: 2, arrows: "to" },
    { from: "Chart", to: "Footer", label: "3 transiciones", width: 1, arrows: "to" }
  ]);
  const container = document.getElementById("mynetwork");
  const data = { nodes: nodes, edges: edges };
  const options = {
    nodes: { shape: "ellipse", font: { color: "#ffffff", size: 14 } },
    edges: { smooth: { type: "curvedCW" }, font: { color: "#94a3b8", size: 12 } },
    physics: { stabilization: true }
  };
  new vis.Network(container, data, options);
</script>
</body>
</html>`;

// In-Memory store for when DATABASE_URL is not provided or during local preview
let inMemoryStore: Network[] = [
  {
    id: "d9b2a1e4-5c8f-4a3b-9e2d-1a8b7c6d5e4f",
    name: "Red de Carga Cognitiva - Ensayo 1",
    description: "Análisis de pupila y secuencia de fijaciones en tarea de esfuerzo cognitivo elevado.",
    htmlContent: SAMPLE_PYVIS_HTML_1,
    fileSizeBytes: 2150,
    nodeCount: 5,
    edgeCount: 6,
    createdAt: new Date(Date.now() - 3600000 * 24),
    updatedAt: new Date(Date.now() - 3600000 * 24),
  },
  {
    id: "f8c7b6a5-4d3e-2f1a-0b9c-8d7e6f5a4b3c",
    name: "Scanpath Network - Visual Search",
    description: "Matriz de transición de miradas entre AOIs del tablero visual.",
    htmlContent: SAMPLE_PYVIS_HTML_2,
    fileSizeBytes: 1840,
    nodeCount: 4,
    edgeCount: 4,
    createdAt: new Date(Date.now() - 3600000 * 48),
    updatedAt: new Date(Date.now() - 3600000 * 48),
  },
];

// Helper to check if Neon connection string is valid
function isNeonConfigured(): boolean {
  return typeof databaseUrl === "string" && databaseUrl.trim().startsWith("postgres");
}

function getDrizzleClient() {
  if (!databaseUrl) throw new Error("No DATABASE_URL configured");
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

export async function getNetworksList(): Promise<NetworkMetadata[]> {
  if (isNeonConfigured()) {
    try {
      const db = getDrizzleClient();
      const rows = await db
        .select({
          id: schema.networks.id,
          name: schema.networks.name,
          description: schema.networks.description,
          fileSizeBytes: schema.networks.fileSizeBytes,
          nodeCount: schema.networks.nodeCount,
          edgeCount: schema.networks.edgeCount,
          createdAt: schema.networks.createdAt,
          updatedAt: schema.networks.updatedAt,
        })
        .from(schema.networks)
        .orderBy(desc(schema.networks.createdAt));
      return rows;
    } catch (err) {
      console.warn("Neon DB query failed, using in-memory store fallback:", err);
    }
  }

  // Fallback to in-memory store
  return inMemoryStore
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(({ htmlContent, ...meta }) => meta);
}

export async function getNetworkById(id: string): Promise<Network | null> {
  if (isNeonConfigured()) {
    try {
      const db = getDrizzleClient();
      const rows = await db
        .select()
        .from(schema.networks)
        .where(eq(schema.networks.id, id))
        .limit(1);
      return rows[0] || null;
    } catch (err) {
      console.warn("Neon DB query failed, checking in-memory store:", err);
    }
  }

  const found = inMemoryStore.find((n) => n.id === id);
  return found || null;
}

export async function createNetwork(data: NewNetwork): Promise<NetworkMetadata> {
  const newId = crypto.randomUUID();
  const now = new Date();

  if (isNeonConfigured()) {
    try {
      const db = getDrizzleClient();
      const [inserted] = await db
        .insert(schema.networks)
        .values({
          ...data,
          id: newId,
        })
        .returning({
          id: schema.networks.id,
          name: schema.networks.name,
          description: schema.networks.description,
          fileSizeBytes: schema.networks.fileSizeBytes,
          nodeCount: schema.networks.nodeCount,
          edgeCount: schema.networks.edgeCount,
          createdAt: schema.networks.createdAt,
          updatedAt: schema.networks.updatedAt,
        });
      return inserted;
    } catch (err) {
      console.warn("Neon DB insert failed, falling back to in-memory store:", err);
    }
  }

  const newRecord: Network = {
    id: newId,
    name: data.name,
    description: data.description || null,
    htmlContent: data.htmlContent,
    fileSizeBytes: data.fileSizeBytes,
    nodeCount: data.nodeCount || null,
    edgeCount: data.edgeCount || null,
    createdAt: now,
    updatedAt: now,
  };

  inMemoryStore.unshift(newRecord);
  const { htmlContent, ...meta } = newRecord;
  return meta;
}

export async function deleteNetwork(id: string): Promise<boolean> {
  if (isNeonConfigured()) {
    try {
      const db = getDrizzleClient();
      await db.delete(schema.networks).where(eq(schema.networks.id, id));
      return true;
    } catch (err) {
      console.warn("Neon DB delete failed, updating in-memory store:", err);
    }
  }

  const initialLength = inMemoryStore.length;
  inMemoryStore = inMemoryStore.filter((n) => n.id !== id);
  return inMemoryStore.length < initialLength;
}
