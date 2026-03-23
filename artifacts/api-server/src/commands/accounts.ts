import { Message, EmbedBuilder } from "discord.js";
import { db } from "@workspace/db";
import { linkedAccountsTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { getPlayer } from "../coc-api";

export async function handleAccounts(message: Message) {
  const userId = message.author.id;

  const accounts = await db
    .select()
    .from(linkedAccountsTable)
    .where(eq(linkedAccountsTable.discordUserId, userId))
    .orderBy(asc(linkedAccountsTable.position));

  if (accounts.length === 0) {
    await message.reply("You have no linked accounts. Use `!link <tag>` to add one.");
    return;
  }

  const players = await Promise.all(
    accounts.map(async (a) => {
      try {
        return await getPlayer(a.playerTag);
      } catch {
        return null;
      }
    })
  );

  const lines = accounts.map((a, i) => {
    const player = players[i];
    if (player) {
      return `**${i + 1}.** ${player.name} — \`${player.tag}\` — TH${player.townHallLevel}`;
    }
    return `**${i + 1}.** \`${a.playerTag}\` — *Could not fetch*`;
  });

  const embed = new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle("Your Linked Accounts")
    .setDescription(lines.join("\n"))
    .setFooter({ text: `${accounts.length}/10 slots used` });

  await message.reply({ embeds: [embed] });
}
