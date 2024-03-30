import { Punishment, PunishmentType, Task, TimeInMs } from "#lib";
import { modlogEmbed } from "#util";
import { GuildMember, Role, TextChannel, User } from "discord.js";
import { Op } from "sequelize";

export class RemoveExpiredPunishments extends Task {
  constructor() {
    super("removeExpiredPunishments", TimeInMs.Second * 10);
  }

  public override async execute() {
    const punishments = await Punishment.findAll({
      where: {
        duration: {
          [Op.lte]: new Date().getTime() + TimeInMs.Second * 10
        },
        type: {
          [Op.in]: ["BAN", "MUTE", "INFRACTION"]
        },
        handled: false
      }
    }).catch(() => null);
    if (!punishments || punishments.length == 0) return;
    for (const punishment of punishments) {
      const guild = await this.client.guilds.fetch(punishment.guildID);
      if (!guild) continue;
      const cfg = await this.client.getGuildConfig(guild);
      let victim: User | GuildMember | null = await guild.members
        .fetch(punishment.victimID)
        .catch(() => null);
      if (!victim) victim = await this.client.users.fetch(punishment.victimID);
      let logReason = "Time's up!";

      if (punishment.type === "BAN") {
        await guild.members.unban(punishment.victimID).catch(() => null);
      } else if (punishment.type === "MUTE") {
        let mutedRole: Role | null = null;
        if (cfg && cfg.mutedRole) {
          mutedRole = await guild.roles.fetch(cfg.mutedRole);
        }
        if (!mutedRole) {
          const roles = await guild.roles.fetch();
          mutedRole = roles.find((v) => v.name === "mute" || v.name === "muted") || null;
        }
        if (mutedRole && victim instanceof GuildMember) await victim.roles.remove(mutedRole);
      } else if (punishment.type === "INFRACTION") {
        const infractionCount = await Punishment.count({
          where: {
            victimID: victim.id,
            guildID: punishment.guildID,
            type: "INFRACTION",
            duration: {
              [Op.gt]: new Date().getTime()
            },
            handled: false
          }
        });
        logReason = `Time's up! (${infractionCount - 1}/${cfg.infractionThreshold})`;
      }
      punishment.handled = true;
      await punishment.save();

      if (!cfg || !cfg?.moderationLogChannel) continue;
      const logChannel = (await guild.channels.fetch(cfg.moderationLogChannel)) as TextChannel;
      if (!logChannel) continue;
      const botMember = await guild.members.fetchMe();
      const logsEntry = await Punishment.create({
        type: (punishment.type === "INFRACTION"
          ? "INFRACTION-REMOVE"
          : "UN" + punishment.type) as PunishmentType,
        guildID: guild.id,
        victimID: punishment.victimID,
        modID: botMember.id,
        reason: logReason,
        handled: true
      });
      if (!logsEntry) {
        logChannel.send("An error occured while trying to create modlog");
        continue;
      }
      logChannel.send({
        embeds: [
          modlogEmbed(logsEntry.id, {
            victim: victim,
            moderator: botMember,
            type: (punishment.type === "INFRACTION"
              ? "INFRACTION-REMOVE"
              : "UN" + punishment.type) as PunishmentType,
            reason: logReason
          })
        ],
        allowedMentions: { parse: [] }
      });
    }
  }
}
