import { pgTable, serial, text, timestamp, integer, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const linkedAccountsTable = pgTable(
  "linked_accounts",
  {
    id: serial("id").primaryKey(),
    discordUserId: text("discord_user_id").notNull(),
    playerTag: text("player_tag").notNull(),
    position: integer("position").notNull().default(1),
    linkedAt: timestamp("linked_at").notNull().defaultNow(),
  },
  (table) => [
    unique("linked_accounts_user_tag_unique").on(table.discordUserId, table.playerTag),
  ]
);

export const insertLinkedAccountSchema = createInsertSchema(linkedAccountsTable).omit({ id: true, linkedAt: true });
export type InsertLinkedAccount = z.infer<typeof insertLinkedAccountSchema>;
export type LinkedAccount = typeof linkedAccountsTable.$inferSelect;
