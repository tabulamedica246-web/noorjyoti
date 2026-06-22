import { pgTable, text, integer, serial } from "drizzle-orm/pg-core";
import { traditionsTable } from "./traditions";

export const scripturesTable = pgTable("scriptures", {
  id: serial("id").primaryKey(),
  traditionId: integer("tradition_id")
    .notNull()
    .references(() => traditionsTable.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  originalName: text("original_name").notNull(),
  description: text("description").notNull(),
  era: text("era").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export type Scripture = typeof scripturesTable.$inferSelect;
