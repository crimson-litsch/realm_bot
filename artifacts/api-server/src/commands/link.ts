import { Message, EmbedBuilder } from "discord.js";
import { db } from "@workspace/db";
import { linkedAccountsTable } from "@workspace/db/schema";
import { eq, and, count } from "drizzle-orm";
import { getPlayer } from "../coc-api";

export async function handleLink(message: Message, args: string[]) {
  const rawTag = args[0];
  if (!rawTag) {
    await message.reply("Please provide a player tag. Usage: `!link #ABC123`");
    return;
  }

  const tag = rawTag.startsWith("#") ? rawTag.toUpperCase() : `#${rawTag.toUpperCase()}`;
  const userId = message.author.id;

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(linkedAccountsTable)
    .where(eq(linkedAccountsTable.discordUserId, userId));

  if (Number(total) >= 10) {
    await message.reply("You have reached the maximum of 10 linked accounts. Use `!unlink <tag>` to remove one first.");
    return;
  }

  const existing = await db
    .select()
    .from(linkedAccountsTable)
    .where(
      and(
        eq(linkedAccountsTable.discordUserId, userId),
        eq(linkedAccountsTable.playerTag, tag)
      )
    );

  if (existing.length > 0) {
    await message.reply(`\`${tag}\` is already linked to your account.`);
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
    discordUserId: userId,
    playerTag: player.tag,
    position: Number(total) + 1,
  });

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle("Account Linked!")
    .setDescription(`Successfully linked **${player.name}** (\`${player.tag}\`) to your Discord profile.`)
    .addFields(
      { name: "Town Hall", value: `Level ${player.townHallLevel}`, inline: true },
      { name: "Trophies", value: `${player.trophies}`, inline: true },
      { name: "Clan", value: player.clan?.name ?? "No Clan", inline: true }
    )
    .setFooter({ text: `Linked accounts: ${Number(total) + 1}/10` });

  await message.reply({ embeds: [embed] });
}
