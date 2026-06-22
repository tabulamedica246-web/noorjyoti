import {
  pgTable,
  text,
  integer,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";
import { scripturesTable } from "./scriptures";

export const favoritesTable = pgTable(
  "favorites",
  {
    userId: text("user_id").notNull(),
    scriptureId: integer("scripture_id")
      .notNull()
      .references(() => scripturesTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.scriptureId] }),
  }),
);

export type Favorite = typeof favoritesTable.$inferSelect;
