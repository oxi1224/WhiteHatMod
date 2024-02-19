import { Command } from "#lib";
import { CommandInteraction, EmbedBuilder, Message } from "discord.js";

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
    const timeDifferece = new Date().getTime() - msg.createdTimestamp;
    const apiPing = msg.client.ws.ping;
    const embed = new EmbedBuilder().addFields([
      { name: "Bot latency", value: `\`\`${Math.round(timeDifferece)}ms\`\``, inline: true },
      { name: "Api latency", value: `\`\`${Math.round(apiPing)}ms\`\``, inline: true }
    ]);
    msg.reply({ embeds: [embed] });
  }
}
