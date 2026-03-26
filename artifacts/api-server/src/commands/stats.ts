import { Message, EmbedBuilder } from "discord.js";
import { db } from "@workspace/db";
import { linkedAccountsTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { getPlayer } from "../coc-api";
import { thImageUrl } from "../coc-assets";
import { thEmoji } from "../emoji-manager";
import { logger } from "../lib/logger";

export async function handleProfile(message: Message, args: string[]) {
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
  } catch (err) {
    logger.error({ err, tag }, "CoC API error in !profile");
    await message.reply(`Could not fetch stats for \`${tag}\`. Check the tag and try again.`);
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0xf39c12)
    .setTitle(`${player.name} — Player Profile`)
    .setDescription(`Tag: \`${player.tag}\``)
    .setThumbnail(thImageUrl(player.townHallLevel))
    .addFields(
      { name: "🏰 Town Hall", value: `${thEmoji(player.townHallLevel)} Level ${player.townHallLevel}`, inline: true },
      { name: "⭐ XP Level", value: `${player.expLevel}`, inline: true },
      { name: "🏆 Trophies", value: `${player.trophies}`, inline: true },
      { name: "🥇 Best Trophies", value: `${player.bestTrophies}`, inline: true },
      { name: "⚔️ Attack Wins", value: `${player.attackWins}`, inline: true },
      { name: "🛡️ Defense Wins", value: `${player.defenseWins}`, inline: true },
      { name: "⭐ War Stars", value: `${player.warStars}`, inline: true },
      { name: "🏅 League", value: player.league?.name ?? "Unranked", inline: true },
      { name: "🏠 Clan", value: player.clan ? `${player.clan.name} (${player.role ?? "Member"})` : "No Clan", inline: true }
    );

  if (player.builderHallLevel) {
    embed.addFields(
      { name: "🔨 Builder Hall", value: `Level ${player.builderHallLevel}`, inline: true },
      { name: "🏆 Builder Trophies", value: `${player.builderBaseTrophies ?? 0}`, inline: true }
    );
  }

  await message.reply({ embeds: [embed] });
}
