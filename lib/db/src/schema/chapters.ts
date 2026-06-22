import { pgTable, text, integer, serial } from "drizzle-orm/pg-core";
import { scripturesTable } from "./scriptures";

export const chaptersTable = pgTable("chapters", {
  id: serial("id").primaryKey(),
  scriptureId: integer("scripture_id")
    .notNull()
    .references(() => scripturesTable.id, { onDelete: "cascade" }),
  number: integer("number").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  passageEn: text("passage_en").notNull(),
  estimatedReadSeconds: integer("estimated_read_seconds").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export type Chapter = typeof chaptersTable.$inferSelect;
