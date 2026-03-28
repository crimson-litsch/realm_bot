import { Message, EmbedBuilder } from "discord.js";
import { db } from "@workspace/db";
import { linkedAccountsTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { getPlayer, CocPlayer } from "../coc-api";
import { thImageUrl } from "../coc-assets";
import { thEmoji } from "../emoji-manager";
import { randomColor } from "../lib/colors";

const SUPERSCRIPTS: Record<number, string> = {
  1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵",
};

const HERO_SHORT: Record<string, string> = {
  "Barbarian King":  "BK",
  "Archer Queen":    "AQ",
  "Grand Warden":    "GW",
  "Royal Champion":  "RC",
  "Minion Prince":   "MP",
  "Dragon Duke":     "DD",
};

const ROLE_LABEL: Record<string, string> = {
  leader:    "Leader",
  coLeader:  "Co-Leader",
  admin:     "Elder",
  member:    "Member",
};

function formatTH(player: CocPlayer): string {
  const weapon = player.townHallWeaponLevel
    ? SUPERSCRIPTS[player.townHallWeaponLevel] ?? ""
    : "";
  return `TH${player.townHallLevel}${weapon}`;
}

function formatHeroes(player: CocPlayer): string {
  const heroes = player.heroes ?? [];
  const mainHeroes = ["Barbarian King", "Archer Queen", "Grand Warden", "Royal Champion", "Minion Prince", "Dragon Duke"];
  const parts: string[] = [];
  for (const name of mainHeroes) {
    const hero = heroes.find((h) => h.name === name);
    if (hero) parts.push(`${HERO_SHORT[name] ?? name} **${hero.level}**`);
  }
  return parts.length > 0 ? parts.join(" · ") : "*No heroes*";
}

function formatClan(player: CocPlayer): string {
  if (!player.clan) return "No Clan";
  const role = player.role ? (ROLE_LABEL[player.role] ?? player.role) : "Member";
  const warPref = player.warPreference === "in" ? "⚔️" : "🏳️";
  return `${warPref} ${role} of **${player.clan.name}**`;
}

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

  const embed = new EmbedBuilder()
    .setColor(randomColor())
    .setAuthor({
      name: `${message.author.displayName}`,
      iconURL: message.author.displayAvatarURL(),
    })
    .setTitle(`Player Accounts (${accounts.length})`);

  const mainPlayer = players.find((p) => p !== null);
  if (mainPlayer) {
    embed.setThumbnail(thImageUrl(mainPlayer.townHallLevel));
  }

  const sections: string[] = [];

  for (let i = 0; i < accounts.length; i++) {
    const player = players[i];
    if (!player) {
      sections.push(`**${i + 1}.** \`${accounts[i].playerTag}\` — *Could not fetch*`);
      continue;
    }

    const defaultMark = i === 0 ? " ✅ *Default*" : "";
    const line1 = `${thEmoji(player.townHallLevel)} **${formatTH(player)} • ${player.name}** (\`${player.tag}\`)${defaultMark}`;
    const line2 = formatHeroes(player);
    const line3 = formatClan(player);

    sections.push(`${line1}\n${line2}\n${line3}`);
  }

  embed.setDescription(sections.join("\n\n"));

  await message.reply({ embeds: [embed] });
}
