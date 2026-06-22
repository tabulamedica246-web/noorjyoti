import { pgTable, text, integer, serial } from "drizzle-orm/pg-core";

export const traditionsTable = pgTable("traditions", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  shortDescription: text("short_description").notNull(),
  longDescription: text("long_description").notNull(),
  founded: text("founded").notNull(),
  region: text("region").notNull(),
  accentColor: text("accent_color").notNull(),
  symbolName: text("symbol_name").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export type Tradition = typeof traditionsTable.$inferSelect;
