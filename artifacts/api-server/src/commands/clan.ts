import { Message, EmbedBuilder } from "discord.js";
import { getClan, clanInGameLink, clanStatsLink } from "../coc-api";
import { logger } from "../lib/logger";
import { PURPLE } from "../lib/colors";

const LEADER_MENTION = "<@1164206581932642334>";
const LEADER_NAME = "D E V I L";

export function makeClanHandler(clanTag: string) {
  return async function handleClan(message: Message) {
    let clan;
    try {
      clan = await getClan(clanTag);
    } catch (err) {
      logger.error({ err, clanTag }, "CoC API error fetching clan");
      await message.reply("Could not fetch clan info. The API may be temporarily unavailable.");
      return;
    }

    const statsUrl = clanStatsLink(clan.tag);
    const inGameUrl = clanInGameLink(clan.tag);

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setThumbnail(clan.badgeUrls.large)
      .addFields(
        {
          name: "Name",
          value: `[${clan.name}](${statsUrl})`,
          inline: false,
        },
        {
          name: "Clan Tag",
          value: `\`${clan.tag}\``,
          inline: true,
        },
        {
          name: "Members",
          value: `${clan.members}/50`,
          inline: true,
        },
        {
          name: "Level",
          value: `${clan.clanLevel}`,
          inline: true,
        },
        {
          name: "Leader",
          value: `${LEADER_MENTION} (${LEADER_NAME})`,
          inline: false,
        },
        {
          name: "Clan Link",
          value: `[Open In Game](<${inGameUrl}>)`,
          inline: false,
        }
      );

    await message.reply({ embeds: [embed] });
  };
}
