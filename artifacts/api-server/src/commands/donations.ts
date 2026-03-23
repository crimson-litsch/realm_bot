import { Message, EmbedBuilder } from "discord.js";
import { db } from "@workspace/db";
import { linkedAccountsTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { getPlayer } from "../coc-api";

export async function handleDonations(message: Message, args: string[]) {
  const userId = message.author.id;
  let tag = args[0];

  if (!tag) {
    const accounts = await db
      .select()
      .from(linkedAccountsTable)
      .where(eq(linkedAccountsTable.discordUserId, userId))
      .orderBy(asc(linkedAccountsTable.position))
      .limit(1);

    if (accounts.length === 0) {
      await message.reply("You have no linked accounts. Use `!link <tag>` to add one.");
      return;
    }
    tag = accounts[0].playerTag;
  } else {
    tag = tag.startsWith("#") ? tag.toUpperCase() : `#${tag.toUpperCase()}`;
  }

  let player;
  try {
    player = await getPlayer(tag);
  } catch {
    await message.reply(`Could not fetch donations for \`${tag}\`. Check the tag and try again.`);
    return;
  }

  const ratio =
    player.donationsReceived > 0
      ? (player.donations / player.donationsReceived).toFixed(2)
      : player.donations > 0
      ? "∞"
      : "0.00";

  const embed = new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle(`${player.name} — Donations`)
    .setDescription(`Tag: \`${player.tag}\``)
    .addFields(
      { name: "🎁 Donated", value: `${player.donations.toLocaleString()}`, inline: true },
      { name: "📥 Received", value: `${player.donationsReceived.toLocaleString()}`, inline: true },
      { name: "📊 Ratio", value: ratio, inline: true },
      { name: "🏠 Clan", value: player.clan?.name ?? "No Clan", inline: true }
    )
    .setFooter({ text: "Donation counts reset each season" });

  await message.reply({ embeds: [embed] });
}
