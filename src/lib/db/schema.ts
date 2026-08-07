import { pgTable, uuid, varchar, text, integer, timestamp } from "drizzle-orm/pg-core";

export const networks = pgTable("networks", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  htmlContent: text("html_content").notNull(),
  fileSizeBytes: integer("file_size_bytes").notNull(),
  nodeCount: integer("node_count"),
  edgeCount: integer("edge_count"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Network = typeof networks.$inferSelect;
export type NewNetwork = typeof networks.$inferInsert;

// Interface for Network Metadata without the large htmlContent payload
export interface NetworkMetadata {
  id: string;
  name: string;
  description: string | null;
  fileSizeBytes: number;
  nodeCount: number | null;
  edgeCount: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}
