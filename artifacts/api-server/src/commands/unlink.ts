import { Message, EmbedBuilder } from "discord.js";
import { db } from "@workspace/db";
import { linkedAccountsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

export async function handleUnlink(message: Message, args: string[]) {
  const rawTag = args[0];
  if (!rawTag) {
    await message.reply("Please provide a player tag. Usage: `!unlink #ABC123`");
    return;
  }

  const tag = rawTag.startsWith("#") ? rawTag.toUpperCase() : `#${rawTag.toUpperCase()}`;
  const userId = message.author.id;

  const deleted = await db
    .delete(linkedAccountsTable)
    .where(
      and(
        eq(linkedAccountsTable.discordUserId, userId),
        eq(linkedAccountsTable.playerTag, tag)
      )
    )
    .returning();

  if (deleted.length === 0) {
    await message.reply(`No linked account found with tag \`${tag}\`.`);
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle("Account Unlinked")
    .setDescription(`Successfully unlinked \`${tag}\` from your Discord profile.`);

  await message.reply({ embeds: [embed] });
}
