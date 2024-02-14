import { Command } from "#lib";
import { CommandInteraction, Message } from "discord.js";

export class Ping extends Command {
  constructor() {
    super("ping", {
      description: "Shows the latency of the bot",
      aliases: ["ping", "latency"],
      args: [],
      slash: true
    });
  }

  override execute(msg: Message | CommandInteraction): void {
    msg.reply(msg.client.ws.ping.toString() + "ms");
  }
}
