import { Message, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { db } from "@workspace/db";
import { linkedAccountsTable } from "@workspace/db/schema";
import { eq, and, count } from "drizzle-orm";
import { getPlayer } from "../coc-api";
import { randomColor } from "../lib/colors";

function isAdmin(message: Message): boolean {
  return (
    message.member?.permissions.has(PermissionFlagsBits.Administrator) === true ||
    message.member?.permissions.has(PermissionFlagsBits.ManageGuild) === true
  );
}

export async function handleLink(message: Message, args: string[]) {
  const mentionMatch = args[0]?.match(/^<@!?(\d+)>$/);
  const isAdminLinking = mentionMatch !== null && mentionMatch !== undefined;

  if (isAdminLinking && !isAdmin(message)) {
    await message.reply("You need **Manage Server** permission to link accounts for other users.");
    return;
  }

  let targetUserId: string;
  let rawTag: string | undefined;

  if (isAdminLinking) {
    targetUserId = mentionMatch![1];
    rawTag = args[1];
    if (!rawTag) {
      await message.reply("Usage: `!link @user #playertag`");
      return;
    }
  } else {
    targetUserId = message.author.id;
    rawTag = args[0];
    if (!rawTag) {
      await message.reply("Please provide a player tag. Usage: `!link #playertag`");
      return;
    }
  }

  const tag = rawTag.startsWith("#") ? rawTag.toUpperCase() : `#${rawTag.toUpperCase()}`;

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(linkedAccountsTable)
    .where(eq(linkedAccountsTable.discordUserId, targetUserId));

  if (Number(total) >= 10) {
    const who = isAdminLinking ? "That user has" : "You have";
    await message.reply(`${who} reached the maximum of 10 linked accounts.`);
    return;
  }

  const existing = await db
    .select()
    .from(linkedAccountsTable)
    .where(
      and(
        eq(linkedAccountsTable.discordUserId, targetUserId),
        eq(linkedAccountsTable.playerTag, tag)
      )
    );

  if (existing.length > 0) {
    await message.reply(`\`${tag}\` is already linked to that account.`);
    return;
  }

  let player;
  try {
    player = await getPlayer(tag);
  } catch {
    await message.reply(`Could not find a player with tag \`${tag}\`. Make sure the tag is correct.`);
    return;
  }

  await db.insert(linkedAccountsTable).values({
    discordUserId: targetUserId,
    playerTag: player.tag,
    position: Number(total) + 1,
  });

  const targetMention = isAdminLinking ? `<@${targetUserId}>` : "your";
  const embed = new EmbedBuilder()
    .setColor(randomColor())
    .setTitle("Account Linked!")
    .setDescription(`Successfully linked **${player.name}** (\`${player.tag}\`) to ${targetMention} Discord profile.`)
    .addFields(
      { name: "Town Hall", value: `Level ${player.townHallLevel}`, inline: true },
      { name: "Trophies", value: `${player.trophies}`, inline: true },
      { name: "Clan", value: player.clan?.name ?? "No Clan", inline: true }
    )
    .setFooter({ text: `Linked accounts: ${Number(total) + 1}/10` });

  await message.reply({ embeds: [embed] });
}
