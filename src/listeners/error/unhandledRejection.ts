import { Listener, colors, staticIDs } from "#lib";
import { codeBlock } from "#util";
import { EmbedBuilder, EmbedField, TextChannel } from "discord.js";

export class UnhandledRejectionListener extends Listener {
  constructor() {
    super("unhandledRejection", {
      emitter: process,
      event: "unhandledRejection"
    });
  }

  public override async execute(err: Error) {
    if (this.client.env === 'dev') throw err;
    if (!err) return;
    const guild = await this.client.guilds.fetch(staticIDs.mainGuild);
    if (!guild) throw err;
    const errorChannel = await guild.channels.fetch(staticIDs.errorChannel) as TextChannel;
    if (!errorChannel) throw err;
    const embed = new EmbedBuilder().setTimestamp().setColor(colors.error);

    const fields: EmbedField[] = [{ name: "Error:", value: codeBlock("", err.name), inline: false }];
    const stack = err.stack ?? "";
    if (stack.length > 1000) {
      let fieldIndex = 1;
      for (let i = 0; i < stack.length; i += 1000) {
        const cont = stack.substring(i, Math.min(stack.length, i + 1000));
        fields.push({
          name: `Call Stack[${fieldIndex}]`,
          value: codeBlock("js", cont),
          inline: false
        });
        fieldIndex++;
      }
    } else {
      fields.push({ name: "Call Stack", value: codeBlock("js", err.stack || ""), inline: false });
    }
    embed.addFields(fields);
    errorChannel.send({
      embeds: [embed]
    });
  }
}
