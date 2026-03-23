import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import { db } from "@workspace/db";
import { linkedAccountsTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { getPlayer } from "../coc-api";

export const data = new SlashCommandBuilder()
  .setName("stats")
  .setDescription("View stats for a linked Clash of Clans account")
  .addStringOption((opt) =>
    opt
      .setName("tag")
      .setDescription("Player tag to look up (defaults to your first linked account)")
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const userId = interaction.user.id;
  let tag = interaction.options.getString("tag");

  if (!tag) {
    const accounts = await db
      .select()
      .from(linkedAccountsTable)
      .where(eq(linkedAccountsTable.discordUserId, userId))
      .orderBy(asc(linkedAccountsTable.position))
      .limit(1);

    if (accounts.length === 0) {
      await interaction.editReply("You have no linked accounts. Use `/link <tag>` to add one.");
      return;
    }

    tag = accounts[0].playerTag;
  } else {
    tag = tag.trim().startsWith("#") ? tag.trim() : `#${tag.trim()}`;
  }

  let player;
  try {
    player = await getPlayer(tag);
  } catch {
    await interaction.editReply(`Could not fetch stats for \`${tag}\`. Check the tag and try again.`);
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0xf39c12)
    .setTitle(`${player.name} — Player Stats`)
    .setDescription(`Tag: \`${player.tag}\``)
    .addFields(
      { name: "🏰 Town Hall", value: `Level ${player.townHallLevel}`, inline: true },
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

  await interaction.editReply({ embeds: [embed] });
}
