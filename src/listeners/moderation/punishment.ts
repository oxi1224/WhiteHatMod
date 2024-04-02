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

  override async execute(guild: Guild, data: ModerationEventData, createEntry: boolean = true) {
    let logsEntry;
    if (createEntry)
      logsEntry = await Punishment.create({
        type: data.type,
        guildID: guild.id,
        victimID: data.victim.id,
        modID: data.moderator.id,
        reason: data.reason,
        duration: data.duration
      });
    const cfg = await this.client.getGuildConfig(guild);
    if (!cfg || !cfg?.moderationLogChannel) return;
    const logChannel = (await guild.channels.fetch(cfg.moderationLogChannel)) as TextChannel;
    if (!logChannel) return;
    if (!logsEntry && createEntry) {
      logChannel.send("An error occured while trying to create modlog");
      return;
    }
    logChannel.send({
      embeds: [modlogEmbed(logsEntry?.id || 0, data)],
      allowedMentions: { parse: [] }
    });
  }
}
