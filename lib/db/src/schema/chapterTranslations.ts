import {
  pgTable,
  text,
  integer,
  serial,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { chaptersTable } from "./chapters";

export const chapterTranslationsTable = pgTable(
  "chapter_translations",
  {
    id: serial("id").primaryKey(),
    chapterId: integer("chapter_id")
      .notNull()
      .references(() => chaptersTable.id, { onDelete: "cascade" }),
    languageCode: text("language_code").notNull(),
    translatedPassage: text("translated_passage").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniqChapterLanguage: unique().on(t.chapterId, t.languageCode),
  }),
);

export type ChapterTranslation = typeof chapterTranslationsTable.$inferSelect;
