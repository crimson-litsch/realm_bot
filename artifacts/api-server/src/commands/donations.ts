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
  .setName("donations")
  .setDescription("View donation stats for a linked Clash of Clans account")
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
    await interaction.editReply(`Could not fetch donations for \`${tag}\`. Check the tag and try again.`);
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
      { name: "🏠 Clan", value: player.clan ? player.clan.name : "No Clan", inline: true }
    )
    .setFooter({ text: "Donation counts reset each season" });

  await interaction.editReply({ embeds: [embed] });
}
