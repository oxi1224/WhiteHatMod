import { GuildConfig, Listener, colors, staticIDs } from "#lib";
import { client } from "#src/bot.js";
import { EmbedBuilder, Guild, TextChannel } from "discord.js";

export class GuildCreate extends Listener {
  constructor() {
    super("guildCreate", {
      emitter: client,
      event: "guildCreate"
    });
  }

  public override async execute(guild: Guild) {
    GuildConfig.create({ id: guild.id });

    const parentGuild = await this.client.guilds.fetch(staticIDs.parentGuild);
    const channel = (await parentGuild.channels
      .fetch(staticIDs.guildLogChannel)
      .catch(() => null)) as TextChannel | null;
    const embed = new EmbedBuilder()
      .setColor(colors.success)
      .setTimestamp()
      .setTitle(`Joined ${guild}`)
      .setDescription(`Member count: ${guild.memberCount}`);
    channel?.send({ embeds: [embed] });
  }
}
