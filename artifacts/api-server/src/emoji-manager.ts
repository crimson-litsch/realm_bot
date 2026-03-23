import { REST, Routes } from "discord.js";
import { logger } from "./lib/logger";

const APPLICATION_ID = "1442251345242493059";

const TH_IMAGE_URLS: Record<number, string> = {
  1:  "https://static.wikia.nocookie.net/clashofclans/images/f/fd/Town_Hall1.png/revision/latest?cb=20170827034930",
  2:  "https://static.wikia.nocookie.net/clashofclans/images/7/7d/Town_Hall2.png/revision/latest?cb=20170827050036",
  3:  "https://static.wikia.nocookie.net/clashofclans/images/d/dd/Town_Hall3.png/revision/latest?cb=20170827050050",
  4:  "https://static.wikia.nocookie.net/clashofclans/images/e/e7/Town_Hall4.png/revision/latest?cb=20170827050104",
  5:  "https://static.wikia.nocookie.net/clashofclans/images/a/a3/Town_Hall5.png/revision/latest?cb=20170827050118",
  6:  "https://static.wikia.nocookie.net/clashofclans/images/5/52/Town_Hall6.png/revision/latest?cb=20170827050220",
  7:  "https://static.wikia.nocookie.net/clashofclans/images/7/75/Town_Hall7.png/revision/latest?cb=20170827051024",
  8:  "https://static.wikia.nocookie.net/clashofclans/images/f/fa/Town_Hall8.png/revision/latest?cb=20170827051039",
  9:  "https://static.wikia.nocookie.net/clashofclans/images/e/e0/Town_Hall9.png/revision/latest?cb=20170827045259",
  10: "https://static.wikia.nocookie.net/clashofclans/images/5/5c/Town_Hall10.png/revision/latest?cb=20170827040043",
  11: "https://static.wikia.nocookie.net/clashofclans/images/9/96/Town_Hall11.png/revision/latest?cb=20210410001514",
  12: "https://static.wikia.nocookie.net/clashofclans/images/b/b7/Town_Hall12.png/revision/latest?cb=20251008133316",
  13: "https://static.wikia.nocookie.net/clashofclans/images/7/73/Town_Hall13.png/revision/latest?cb=20251008133419",
  14: "https://static.wikia.nocookie.net/clashofclans/images/b/b6/Town_Hall14.png/revision/latest?cb=20251008133902",
  15: "https://static.wikia.nocookie.net/clashofclans/images/d/d4/Town_Hall15.png/revision/latest?cb=20251008075733",
  16: "https://static.wikia.nocookie.net/clashofclans/images/5/53/Town_Hall16.png/revision/latest?cb=20231211062744",
  17: "https://static.wikia.nocookie.net/clashofclans/images/2/24/Town_Hall17-1.png/revision/latest?cb=20241122153337",
  18: "https://static.wikia.nocookie.net/clashofclans/images/7/76/Town_Hall18.png/revision/latest?cb=20251117162127",
};

const TH_LEVELS = Object.keys(TH_IMAGE_URLS).map(Number);

function emojiName(level: number): string {
  return `th${level}`;
}

const emojiCache = new Map<number, string>();

async function fetchImageAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image from ${url}: ${res.status}`);
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const contentType = res.headers.get("content-type") ?? "image/png";
  return `data:${contentType};base64,${base64}`;
}

export async function initEmojiManager(token: string): Promise<void> {
  const rest = new REST().setToken(token);

  interface DiscordEmoji { id: string; name: string }

  const existing = await rest.get(
    Routes.applicationEmojis(APPLICATION_ID)
  ) as { items: DiscordEmoji[] };

  for (const emoji of existing.items) {
    const match = emoji.name.match(/^th(\d+)$/);
    if (match) {
      const level = parseInt(match[1], 10);
      emojiCache.set(level, `<:${emoji.name}:${emoji.id}>`);
    }
  }

  logger.info({ cached: emojiCache.size }, "Loaded existing TH emojis");

  for (const level of TH_LEVELS) {
    if (emojiCache.has(level)) continue;

    const imageUrl = TH_IMAGE_URLS[level];
    if (!imageUrl) continue;

    try {
      const image = await fetchImageAsBase64(imageUrl);
      const created = await rest.post(
        Routes.applicationEmojis(APPLICATION_ID),
        { body: { name: emojiName(level), image } }
      ) as DiscordEmoji;
      emojiCache.set(level, `<:${created.name}:${created.id}>`);
      logger.info({ level }, `Uploaded TH${level} emoji`);
    } catch (err) {
      logger.error({ err, level }, `Failed to upload TH${level} emoji`);
    }
  }

  logger.info({ total: emojiCache.size }, "TH emoji manager ready");
}

export function thEmoji(level: number): string {
  return emojiCache.get(level) ?? `TH${level}`;
}
