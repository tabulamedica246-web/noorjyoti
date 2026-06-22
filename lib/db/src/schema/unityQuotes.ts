import { pgTable, text, integer, serial } from "drizzle-orm/pg-core";
import { traditionsTable } from "./traditions";

export const unityQuotesTable = pgTable("unity_quotes", {
  id: serial("id").primaryKey(),
  traditionId: integer("tradition_id")
    .notNull()
    .references(() => traditionsTable.id, { onDelete: "cascade" }),
  quote: text("quote").notNull(),
  attribution: text("attribution").notNull(),
  theme: text("theme").notNull(),
});

export type UnityQuote = typeof unityQuotesTable.$inferSelect;
