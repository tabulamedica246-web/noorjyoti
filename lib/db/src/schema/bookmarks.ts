import {
  pgTable,
  text,
  integer,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";
import { chaptersTable } from "./chapters";

export const bookmarksTable = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  chapterId: integer("chapter_id")
    .notNull()
    .references(() => chaptersTable.id, { onDelete: "cascade" }),
  positionSeconds: integer("position_seconds").notNull().default(0),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Bookmark = typeof bookmarksTable.$inferSelect;
