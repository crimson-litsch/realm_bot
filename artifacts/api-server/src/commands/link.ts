import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import { db } from "@workspace/db";
import { linkedAccountsTable } from "@workspace/db/schema";
import { eq, and, count } from "drizzle-orm";
import { getPlayer } from "../coc-api";

export const data = new SlashCommandBuilder()
  .setName("link")
  .setDescription("Link a Clash of Clans account to your Discord profile")
  .addStringOption((opt) =>
    opt
      .setName("tag")
      .setDescription("Your player tag (e.g. #ABC123)")
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ flags: 64 });

  const rawTag = interaction.options.getString("tag", true).trim();
  const tag = rawTag.startsWith("#") ? rawTag : `#${rawTag}`;
  const userId = interaction.user.id;

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(linkedAccountsTable)
    .where(eq(linkedAccountsTable.discordUserId, userId));

  if (Number(total) >= 10) {
    await interaction.editReply("You have reached the maximum of 10 linked accounts. Use `/unlink` to remove one first.");
    return;
  }

  const existing = await db
    .select()
    .from(linkedAccountsTable)
    .where(
      and(
        eq(linkedAccountsTable.discordUserId, userId),
        eq(linkedAccountsTable.playerTag, tag.toUpperCase())
      )
    );

  if (existing.length > 0) {
    await interaction.editReply(`\`${tag}\` is already linked to your account.`);
    return;
  }

  let player;
  try {
    player = await getPlayer(tag);
  } catch {
    await interaction.editReply(`Could not find a player with tag \`${tag}\`. Make sure the tag is correct.`);
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

  await interaction.editReply({ embeds: [embed] });
}
