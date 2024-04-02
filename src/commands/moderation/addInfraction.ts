import { ArgumentTypes, Command, Punishment, TimeInMs, colors } from "#lib";
import {
  ApplicationCommandOptionType,
  CommandInteraction,
  EmbedBuilder,
  Message,
  PermissionFlagsBits,
  User,
  inlineCode,
  userMention
} from "discord.js";
import { Op } from "sequelize";

export class AddInfraction extends Command {
  constructor() {
    super("addinfraction", {
      description: "Adds an infraction to a user",
      aliases: ["addinfraction", "add_infraction", "addinf", "add_inf"],
      category: "moderation",
      usage: "addinfraction <user> <duration> [reason]",
      examples: ["addinfraction @oxi 7d spamming"],
      args: [
        {
          name: "user",
          type: ArgumentTypes.User,
          slashType: ApplicationCommandOptionType.User,
          required: true,
          description: "The user to who the infraction will be added to"
        },
        {
          name: "duration",
          type: ArgumentTypes.Duration,
          slashType: ApplicationCommandOptionType.String,
          required: true,
          description: "How long the infraction should last"
        },
        {
          name: "reason",
          type: ArgumentTypes.Text,
          slashType: ApplicationCommandOptionType.String,
          required: false,
          description: "The reason of the infraction"
        }
      ],
      botPerms: [PermissionFlagsBits.BanMembers],
      userPerms: [PermissionFlagsBits.BanMembers],
      slash: true
    });
  }

  public override async execute(
    msg: Message | CommandInteraction,
    args: {
      user: User;
      duration: number;
      reason?: string;
    }
  ) {
    const cfg = await this.client.getGuildConfig(msg.guild!.id);
    let infractionCount = await Punishment.count({
      where: {
        victimID: args.user.id,
        guildID: msg.guild!.id,
        type: "INFRACTION",
        duration: {
          [Op.gt]: new Date().getTime()
        },
        handled: false
      }
    });

    infractionCount++;
    this.client.emit("punishmentAdd", msg.guild, {
      type: "INFRACTION",
      victim: args.user,
      moderator: msg.member,
      duration: args.duration,
      reason: args.reason
    });

    await msg.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(colors.success)
          .setDescription(`Successfully added infraction to ${userMention(args.user.id)}`)
      ]
    });

    await args.user
      .send({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.base)
            .setTitle(`You've gotten an infraction in ${msg.guild!.name}`)
            .setDescription(
              `You're at ${infractionCount}/${cfg.infractionThreshold}\nReason: ${inlineCode(args.reason || "N/A")}`
            )
            .setTimestamp()
        ]
      })
      .catch(() => null);

    if (infractionCount >= cfg.infractionThreshold) {
      await this.client.ban(msg.guild!.id, {
        mod: await msg.guild!.members.fetchMe(),
        victim: args.user,
        duration: new Date().getTime() + TimeInMs.Day * 3,
        reason: `Automod: Reached infraction limit (${cfg.infractionThreshold})`
      });

      await Punishment.update(
        {
          handled: true
        },
        {
          where: {
            victimID: args.user.id,
            guildID: msg.guild!.id,
            type: "INFRACTION",
            duration: {
              [Op.gt]: new Date().getTime()
            },
            handled: false
          }
        }
      );
    }
  }
}
