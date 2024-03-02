import { Listener, colors } from "#lib";
import { client } from "#src/bot.js";
import { EmbedBuilder, GuildChannel, TextChannel, channelMention } from "discord.js";

export class ChannelDelete extends Listener {
  constructor() {
    super("channelDelete", {
      emitter: client,
      event: "channelDelete"
    });
  }

  public override async execute(channel: GuildChannel) {
    const cfg = await this.client.getGuildConfig(channel.guild.id);
    if (!cfg || !cfg.otherLogChannel) return;
    const logChannel = (await channel.guild.channels
      .fetch(cfg.otherLogChannel)
      .catch(() => null)) as TextChannel | null;
    if (!logChannel) return;
    logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(colors.base)
          .setTitle("Channel deleted")
          .setDescription(channelMention(channel.id))
      ]
    });
  }
}
