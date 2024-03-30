import { Listener, Punishment, TimeInMs, colors } from "#lib";
import { client } from "#src/bot.js";
import { EmbedBuilder, Message, PermissionFlagsBits, inlineCode } from "discord.js";
import { Op } from "sequelize";

const inviteRegex =
  /(?:https?:\/\/)?(?:www\.)?(?:discord(?:\.gg|app\.com\/invite)\/|discord\.com\/invite\/)([a-zA-Z0-9-]+)/g;

export class Invite extends Listener {
  constructor() {
    super("Invite", {
      emitter: client,
      event: "messageCreate"
    });
  }

  public override async execute(msg: Message) {
    if (!msg.inGuild()) return;
    const hasInvite = inviteRegex.test(msg.content);
    if (!hasInvite || !msg.member) return;
    const cfg = await this.client.getGuildConfig(msg.guild);
    const isImmune = msg.member.roles.cache.hasAny(...cfg.automodImmune);
    if (isImmune || msg.member.permissions.has(PermissionFlagsBits.ManageMessages)) return;

    let infractionCount = await Punishment.count({
      where: {
        victimID: msg.author.id,
        guildID: msg.guild.id,
        type: "INFRACTION",
        duration: {
          [Op.gt]: new Date().getTime()
        },
        handled: false
      }
    });

    const botUser = await msg.guild.members.fetchMe();
    const infractionReason = `Automod: Sending an invite link (${infractionCount + 1}/${cfg.infractionThreshold})`;
    if (infractionCount < cfg.infractionThreshold) {
      this.client.emit("punishmentAdd", msg.guild, {
        type: "INFRACTION",
        victim: msg.author,
        moderator: botUser,
        duration: new Date().getTime() + TimeInMs.Day * 7,
        reason: infractionReason
      });
      infractionCount += 1;
      await msg.author
        .send({
          embeds: [
            new EmbedBuilder()
              .setColor(colors.base)
              .setTitle(`You've gotten an infraction in ${msg.guild.name}`)
              .setDescription(
                `You're at ${infractionCount}/${cfg.infractionThreshold}\nReason: ${inlineCode(infractionReason)}`
              )
              .setTimestamp()
          ]
        })
        .catch(() => null);
    }

    if (infractionCount >= cfg.infractionThreshold) {
      await this.client.ban(msg.guild.id, {
        mod: botUser,
        victim: msg.author,
        duration: new Date().getTime() + TimeInMs.Day * 3,
        reason: `Automod: Reached infraction limit (${cfg.infractionThreshold})`
      });

      await Punishment.update(
        {
          handled: true
        },
        {
          where: {
            victimID: msg.author.id,
            guildID: msg.guild.id,
            type: "INFRACTION",
            duration: {
              [Op.gt]: new Date().getTime()
            },
            handled: false
          }
        }
      );
    }
    await msg.delete().catch(() => null);
  }
}
