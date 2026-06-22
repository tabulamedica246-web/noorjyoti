import {
  pgTable,
  text,
  integer,
  serial,
  customType,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { chaptersTable } from "./chapters";

const bytea = customType<{ data: Buffer; default: false }>({
  dataType() {
    return "bytea";
  },
});

export const audioTracksTable = pgTable(
  "audio_tracks",
  {
    id: serial("id").primaryKey(),
    chapterId: integer("chapter_id")
      .notNull()
      .references(() => chaptersTable.id, { onDelete: "cascade" }),
    language: text("language").notNull(),
    voice: text("voice").notNull(),
    source: text("source").notNull(),
    durationSeconds: integer("duration_seconds").notNull(),
    audioBytes: bytea("audio_bytes"),
    objectPath: text("object_path"),
    contentType: text("content_type").notNull().default("audio/mpeg"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex("audio_tracks_unique").on(
      t.chapterId,
      t.language,
      t.voice,
    ),
  }),
);

export type AudioTrack = typeof audioTracksTable.$inferSelect;
