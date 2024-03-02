import { Listener, colors, staticIDs } from "#lib";
import { client } from "#src/bot.js";
import { EmbedBuilder, Guild, TextChannel } from "discord.js";

export class GuildDelete extends Listener {
  constructor() {
    super("guildDelete", {
      emitter: client,
      event: "guildDelete"
    });
  }

  public override async execute(guild: Guild) {
    const parentGuild = await this.client.guilds.fetch(staticIDs.parentGuild);
    const channel = (await parentGuild.channels
      .fetch(staticIDs.guildLogChannel)
      .catch(() => null)) as TextChannel | null;
    const embed = new EmbedBuilder()
      .setColor(colors.success)
      .setTimestamp()
      .setTitle(`Left ${guild}`)
      .setDescription(`Member count: ${guild.memberCount}`);
    channel?.send({ embeds: [embed] });
  }
}
