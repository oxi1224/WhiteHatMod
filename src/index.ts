import { CommandHandler } from "#lib";
import { Client, CommandInteraction, GatewayIntentBits, Message } from "discord.js";
import "dotenv/config";

export const client = new Client({
  intents: Object.keys(GatewayIntentBits)
    .map((i) =>
      typeof i === "string" ? GatewayIntentBits[i as keyof typeof GatewayIntentBits] : i
    )
    .reduce((acc, p) => acc | p, 0)
});

const cmdHandler = new CommandHandler("!", client, "../commands/index.js");

await cmdHandler.load();
client.addListener("messageCreate", (msg: Message) => cmdHandler.handleMessage(msg));
client.addListener("interactionCreate", (interaction: CommandInteraction) =>
  cmdHandler.handleInteraction(interaction)
);

client.login(process.env.TOKEN);

// TODO - Argument parsing for both interactions and message commands
// TODO - Add requirements and checks for them for user and bot
// TODO - (?) Abstract client into it's own class