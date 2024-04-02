import { ActionMessage, Command, colors } from "#lib";
import { EmbedBuilder } from "discord.js";

export class Ping extends Command {
  constructor() {
    super("ping", {
      description: "Shows the latency of the bot",
      aliases: ["ping", "latency"],
      category: "info",
      usage: "ping",
      examples: ["ping"],
      args: [],
      slash: true
    });
  }

  override execute(msg: ActionMessage) {
    const timeDifferece = new Date().getTime() - msg.createdTimestamp;
    const apiPing = msg.client.ws.ping;
    const embed = new EmbedBuilder()
      .addFields([
        { name: "Bot latency", value: `\`\`${Math.round(timeDifferece)}ms\`\``, inline: true },
        { name: "Api latency", value: `\`\`${Math.round(apiPing)}ms\`\``, inline: true }
      ])
      .setColor(colors.base);
    msg.reply({ embeds: [embed] });
  }
}
