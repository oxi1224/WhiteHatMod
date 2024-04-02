import { ActionMessage, ArgumentTypes, Command, Punishment, colors } from "#lib";
import {
  ApplicationCommandOptionType,
  EmbedBuilder,
  PermissionFlagsBits,
  User,
  inlineCode,
  userMention
} from "discord.js";
import { Op } from "sequelize";

export class RemoveInfraction extends Command {
  constructor() {
    super("removeinfraction", {
      description: "Removes an infraction from a user",
      aliases: ["removeinfraction", "rminf", "rm_inf", "remove_infraction"],
      category: "moderation",
      usage: "removeinfraction <user> <modlogid> [reason]",
      examples: ["removeinfraction @oxi 7215 remove infraction"],
      args: [
        {
          name: "user",
          type: ArgumentTypes.User,
          slashType: ApplicationCommandOptionType.User,
          required: true,
          description: "The user from who the infraction will be removed"
        },
        {
          name: "modlogid",
          type: ArgumentTypes.Int,
          slashType: ApplicationCommandOptionType.Number,
          required: true,
          description: "ID of the modlog (use modlogs command to obtain)"
        },
        {
          name: "reason",
          type: ArgumentTypes.Text,
          slashType: ApplicationCommandOptionType.String,
          required: false,
          description: "The reason of the removal"
        }
      ],
      botPerms: [PermissionFlagsBits.BanMembers],
      userPerms: [PermissionFlagsBits.BanMembers],
      slash: true
    });
  }

  public override async execute(
    msg: ActionMessage,
    args: {
      user: User;
      modlogid: number;
      reason?: string;
    }
  ) {
    const modlog = await Punishment.findByPk(args.modlogid);
    if (!modlog || modlog.type !== "INFRACTION" || modlog.handled === true)
      return msg.reply({
        embeds: [
          new EmbedBuilder().setColor(colors.error).setDescription("Invalid modlog id specified")
        ]
      });

    modlog.handled = true;
    await modlog.save();

    await msg.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(colors.success)
          .setDescription(`Successfully removed infraction from ${userMention(args.user.id)}`)
      ]
    });

    const cfg = await this.client.getGuildConfig(msg.guild!.id);
    const infractionCount = await Punishment.count({
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

    await args.user
      .send({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.base)
            .setTitle(`An infraction has been removed in ${msg.guild!.name}`)
            .setDescription(
              `You're at ${infractionCount}/${cfg.infractionThreshold}\nReason: ${inlineCode(args.reason || "N/A")}`
            )
            .setTimestamp()
        ]
      })
      .catch(() => null);

    this.client.emit("punishmentAdd", msg.guild, {
      type: "INFRACTION-REMOVE",
      victim: args.user,
      moderator: msg.member,
      reason: args.reason
    });
    return;
  }
}
