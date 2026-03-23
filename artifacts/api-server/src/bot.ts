import {
  Client,
  GatewayIntentBits,
  Events,
  Message,
} from "discord.js";
import { logger } from "./lib/logger";
import { initEmojiManager } from "./emoji-manager";
import { handleLink } from "./commands/link";
import { handleUnlink } from "./commands/unlink";
import { handleProfile } from "./commands/stats";
import { handleDonations } from "./commands/donations";
import { handleAccounts } from "./commands/accounts";

const token = process.env["DISCORD_BOT_TOKEN"];

if (!token) {
  throw new Error("DISCORD_BOT_TOKEN must be set.");
}

const PREFIX = "!";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  logger.info({ tag: readyClient.user.tag }, "Discord bot is ready");
  void initEmojiManager(token!);
});

client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const command = args.shift()?.toLowerCase();

  try {
    switch (command) {
      case "link":
        await handleLink(message, args);
        break;
      case "unlink":
        await handleUnlink(message, args);
        break;
      case "profile":
        await handleProfile(message, args);
        break;
      case "donations":
        await handleDonations(message, args);
        break;
      case "accounts":
        await handleAccounts(message);
        break;
      case "help":
        await message.reply(
          "**Clash of Clans Bot Commands**\n" +
          "`!link <tag>` — Link a CoC account (up to 10)\n" +
          "`!unlink <tag>` — Unlink a CoC account\n" +
          "`!accounts` — List your linked accounts\n" +
          "`!profile [tag]` — View player stats\n" +
          "`!donations [tag]` — View donation stats"
        );
        break;
    }
  } catch (err) {
    logger.error({ err, command }, "Command error");
    await message.reply("Something went wrong running that command.");
  }
});

export function startBot() {
  client.login(token).catch((err) => {
    logger.error({ err }, "Failed to log in to Discord");
    process.exit(1);
  });
}

export default client;
