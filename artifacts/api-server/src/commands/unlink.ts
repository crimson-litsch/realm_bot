import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import { db } from "@workspace/db";
import { linkedAccountsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

export const data = new SlashCommandBuilder()
  .setName("unlink")
  .setDescription("Unlink a Clash of Clans account from your Discord profile")
  .addStringOption((opt) =>
    opt
      .setName("tag")
      .setDescription("The player tag to unlink (e.g. #ABC123)")
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: 64 });

  const rawTag = interaction.options.getString("tag", true).trim();
  const tag = rawTag.startsWith("#") ? rawTag : `#${rawTag}`;
  const userId = interaction.user.id;

  const deleted = await db
    .delete(linkedAccountsTable)
    .where(
      and(
        eq(linkedAccountsTable.discordUserId, userId),
        eq(linkedAccountsTable.playerTag, tag.toUpperCase())
      )
    )
    .returning();

  if (deleted.length === 0) {
    await interaction.editReply(`No linked account found with tag \`${tag}\`.`);
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0xe74c3c)
    .setTitle("Account Unlinked")
    .setDescription(`Successfully unlinked \`${tag}\` from your Discord profile.`);

  await interaction.editReply({ embeds: [embed] });
}
