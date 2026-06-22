import { pgTable, text, integer, serial } from "drizzle-orm/pg-core";

export const thematicPathsTable = pgTable("thematic_paths", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  accentColor: text("accent_color").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const thematicPathItemsTable = pgTable("thematic_path_items", {
  id: serial("id").primaryKey(),
  pathId: integer("path_id")
    .notNull()
    .references(() => thematicPathsTable.id, { onDelete: "cascade" }),
  verseText: text("verse_text").notNull(),
  reference: text("reference").notNull(),
  traditionLabel: text("tradition_label").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export type ThematicPath = typeof thematicPathsTable.$inferSelect;
export type ThematicPathItem = typeof thematicPathItemsTable.$inferSelect;
