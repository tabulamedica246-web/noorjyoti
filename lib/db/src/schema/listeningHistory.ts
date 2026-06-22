import {
  pgTable,
  text,
  integer,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";
import { chaptersTable } from "./chapters";

export const listeningHistoryTable = pgTable(
  "listening_history",
  {
    userId: text("user_id").notNull(),
    chapterId: integer("chapter_id")
      .notNull()
      .references(() => chaptersTable.id, { onDelete: "cascade" }),
    positionSeconds: integer("position_seconds").notNull().default(0),
    completed: integer("completed").notNull().default(0),
    lastPlayedAt: timestamp("last_played_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.chapterId] }),
  }),
);

export type ListeningHistory = typeof listeningHistoryTable.$inferSelect;
