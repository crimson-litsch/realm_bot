import {
  Client,
  GatewayIntentBits,
  Events,
  REST,
  Routes,
  Collection,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { logger } from "./lib/logger";
import * as linkCmd from "./commands/link";
import * as unlinkCmd from "./commands/unlink";
import * as statsCmd from "./commands/stats";
import * as donationsCmd from "./commands/donations";
import * as accountsCmd from "./commands/accounts";

const token = process.env["DISCORD_BOT_TOKEN"];
const clientId = "1442251345242493059";

if (!token) {
  throw new Error("DISCORD_BOT_TOKEN must be set.");
}

interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

const commands = new Collection<string, Command>();
const commandList: Command[] = [
  linkCmd,
  unlinkCmd,
  statsCmd,
  donationsCmd,
  accountsCmd,
];

for (const cmd of commandList) {
  commands.set(cmd.data.name, cmd);
}

async function registerCommands() {
  const rest = new REST().setToken(token!);
  const body = commandList.map((c) => c.data.toJSON());

  try {
    logger.info("Registering slash commands...");
    await rest.put(Routes.applicationCommands(clientId), { body });
    logger.info("Slash commands registered successfully");
  } catch (err) {
    logger.error({ err }, "Failed to register slash commands");
  }
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, (readyClient) => {
  logger.info({ tag: readyClient.user.tag }, "Discord bot is ready");
  void registerCommands();
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    logger.error({ err, command: interaction.commandName }, "Command error");
    const msg = { content: "Something went wrong running that command.", flags: 64 as const };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
});

export function startBot() {
  client.login(token).catch((err) => {
    logger.error({ err }, "Failed to log in to Discord");
    process.exit(1);
  });
}

export default client;
