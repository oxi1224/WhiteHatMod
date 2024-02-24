import { Listener, ModerationEventData, Punishment } from "#lib";
import { client } from "#src/bot.js";
import { modlogEmbed } from "#util";
import { Guild, TextChannel } from "discord.js";

export class PunishmentListener extends Listener {
  constructor() {
    super("punishmentListener", {
      emitter: client,
      event: "punishmentAdd"
    });
  }

  override async execute(guild: Guild, data: ModerationEventData) {
    const cfg = await this.client.getGuildConfig(guild);
    if (!cfg || !cfg?.logChannel) return;
    const logChannel = (await guild.channels.fetch(cfg.logChannel)) as TextChannel;
    if (!logChannel) return;
    const logsEntry = await Punishment.create({
      type: data.type,
      guildID: guild.id,
      victimID: data.victim.id,
      modID: data.moderator.id,
      reason: data.reason,
      duration: data.duration
    });
    if (!logsEntry) {
      logChannel.send("An error occured while trying to create modlog");
      return;
    }
    logChannel.send({
      embeds: [modlogEmbed(logsEntry.id, data)],
      allowedMentions: { parse: [] }
    });
  }
}
