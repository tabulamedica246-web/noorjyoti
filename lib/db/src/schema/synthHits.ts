import {
  pgTable,
  text,
  serial,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const synthHitsTable = pgTable(
  "synth_hits",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("synth_hits_user_created_idx").on(t.userId, t.createdAt)],
);

export type SynthHit = typeof synthHitsTable.$inferSelect;
