import { Message, EmbedBuilder } from "discord.js";
import { thEmoji } from "../emoji-manager";

const FWA_BASES = [
  {
    th: 13,
    url: "https://link.clashofclans.com/en?action=OpenLayout&id=TH13%3AWB%3AAAAAQgAAAAIWODTV3cHR7wJzCKeryI6m",
  },
  {
    th: 14,
    url: "https://link.clashofclans.com/en?action=OpenLayout&id=TH14%3AWB%3AAAAAKQAAAAKUCeIxKtWBXE3tN1NFx-g5",
  },
  {
    th: 15,
    url: "https://link.clashofclans.com/en?action=OpenLayout&id=TH15%3AWB%3AAAAAEwAAAAKwiZqH53PRfWVC-cSJWC2T",
  },
  {
    th: 16,
    url: "https://link.clashofclans.com/en?action=OpenLayout&id=TH16%3AWB%3AAAAAVgAAAAHbPb7-41TXC2CoNSuVK7im",
  },
  {
    th: 17,
    url: "https://link.clashofclans.com/en?action=OpenLayout&id=TH17%3AWB%3AAAAAEQAAAAK7-ATdDwCRXuVtGw2iCyg7",
  },
  {
    th: 18,
    url: "https://link.clashofclans.com/en?action=OpenLayout&id=TH18%3AWB%3AAAAAIwAAAAKaHrzvlSDJuLi3ln-kSTrM",
  },
];

function buildEmbed(): EmbedBuilder {
  const lines = FWA_BASES.map(
    ({ th, url }) => `${thEmoji(th)} [**TH${th} FWA BASE**](<${url}>)`
  ).join("\n\n");

  return new EmbedBuilder()
    .setColor(0xe67e22)
    .setTitle("FWA Approved Bases")
    .setDescription(
      "Here are the links of approved FWA bases. If you just upgraded Town Hall, make sure to build new walls and defenses for the base to work properly.\n\n" +
      lines
    );
}

export async function handleBases(message: Message) {
  const reply = await message.reply({ embeds: [buildEmbed()] });

  setTimeout(async () => {
    try {
      await reply.edit({
        embeds: [
          new EmbedBuilder()
            .setColor(0x95a5a6)
            .setDescription("`!bases` expired, run again for newest info"),
        ],
      });
    } catch {
      // Message may have been deleted — ignore
    }
  }, 30_000);
}
