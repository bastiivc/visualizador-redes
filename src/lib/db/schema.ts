import { pgTable, uuid, varchar, text, integer, timestamp } from "drizzle-orm/pg-core";

// Table: folders
export const folders = pgTable("folders", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentId: uuid("parent_id"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 50 }).default("cyan"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Table: files (HTML and PNG files)
export const files = pgTable("files", {
  id: uuid("id").primaryKey().defaultRandom(),
  folderId: uuid("folder_id").references(() => folders.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  fileType: varchar("file_type", { length: 20 }).notNull(), // 'html' | 'png'
  content: text("content"), // HTML string or data:image/png;base64,... (nullable if in storage)
  storageKey: text("storage_key"), // Path or key in storage (local or S3/R2)
  fileSizeBytes: integer("file_size_bytes").notNull(),
  nodeCount: integer("node_count"),
  edgeCount: integer("edge_count"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;

export type FileRecord = typeof files.$inferSelect;
export type NewFileRecord = typeof files.$inferInsert;

// Interface for File Metadata without the heavy content payload
export interface FileMetadata {
  id: string;
  folderId: string | null;
  name: string;
  description: string | null;
  fileType: "html" | "png" | string;
  fileSizeBytes: number;
  nodeCount: number | null;
  edgeCount: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface FolderWithStats extends Folder {
  fileCount?: number;
  totalSizeBytes?: number;
  htmlCount?: number;
  pngCount?: number;
}

// Backward-compatibility aliases
export type NetworkMetadata = FileMetadata;
export type Network = FileRecord;
export type NewNetwork = NewFileRecord;
