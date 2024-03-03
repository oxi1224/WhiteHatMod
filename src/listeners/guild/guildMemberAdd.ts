import { Listener, Punishment } from "#lib";
import { client } from "#src/bot.js";
import { GuildMember } from "discord.js";
import { Op } from "sequelize";

export class GuildMemberAdd extends Listener {
  constructor() {
    super("guildMemberAdd", {
      emitter: client,
      event: "guildMemberAdd"
    });
  }

  public override async execute(member: GuildMember) {
    const cfg = await this.client.getGuildConfig(member.guild.id);
    for (const rID of cfg.joinRoles) {
      const r = await member.guild.roles.fetch(rID).catch(() => null);
      if (r) await member.roles.add(r).catch(() => null);
    }
    if (!cfg.mutedRole) return;
    const role = await member.guild.roles.fetch(cfg.mutedRole).catch(() => null);
    if (!role) return;
    const activeMute: Punishment | null = await Punishment.findOne({
      // @ts-expect-error Weird seuqlize caveat, works fine
      where: {
        victimID: member.id,
        type: "MUTE",
        duration: {
          [Op.or]: {
            [Op.gte]: new Date().getTime(),
            [Op.eq]: null
          }
        }
      }
    }).catch(() => null);
    if (activeMute) member.roles.add(role);
  }
}
