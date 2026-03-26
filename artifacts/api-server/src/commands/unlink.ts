import { Message, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { db } from "@workspace/db";
import { linkedAccountsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

function isAdmin(message: Message): boolean {
  return (
    message.member?.permissions.has(PermissionFlagsBits.Administrator) === true ||
    message.member?.permissions.has(PermissionFlagsBits.ManageGuild) === true
  );
}

export async function handleUnlink(message: Message, args: string[]) {
  if (!isAdmin(message)) {
    await message.reply("Only server leaders can use `!unlink`.");
    return;
  }

  const mentionMatch = args[0]?.match(/^<@!?(\d+)>$/);
  if (!mentionMatch) {
    await message.reply("Usage: `!unlink @user #playertag`");
    return;
  }

  const targetUserId = mentionMatch[1];
  const rawTag = args[1];

  if (!rawTag) {
    await message.reply("Usage: `!unlink @user #playertag`");
    return;
  }

  const tag = rawTag.startsWith("#") ? rawTag.toUpperCase() : `#${rawTag.toUpperCase()}`;

  const deleted = await db
    .delete(linkedAccountsTable)
    .where(
      and(
        eq(linkedAccountsTable.discordUserId, targetUserId),
        eq(linkedAccountsTable.playerTag, tag)
      )
    )
    .returning();

  if (deleted.length === 0) {
    await message.reply(`No linked account found for <@${targetUserId}> with tag \`${tag}\`.`);
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle("Account Unlinked")
    .setDescription(`Successfully unlinked \`${tag}\` from <@${targetUserId}>'s profile.`);

  await message.reply({ embeds: [embed] });
}
