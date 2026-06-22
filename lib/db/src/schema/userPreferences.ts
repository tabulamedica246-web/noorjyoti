import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const userPreferencesTable = pgTable("user_preferences", {
  userId: text("user_id").primaryKey(),
  defaultLanguage: text("default_language").notNull().default("en"),
  defaultVoice: text("default_voice").notNull().default("female_warm"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type UserPreferences = typeof userPreferencesTable.$inferSelect;
