import { ActionMessage, ArgumentTypes, Command, FlagTypes, resEmbed } from "#lib";
import {
  ApplicationCommandOptionType,
  GuildMemberResolvable,
  PermissionFlagsBits,
  User
} from "discord.js";

export class Ban extends Command {
  constructor() {
    super("ban", {
      description: "Bans a user from the guild",
      aliases: ["ban"],
      category: "moderation",
      usage: "ban <user> [duration] [reason] [--delete number]",
      examples: ["ban @oxi 7d spamming --delete 6", "ban @oxi spamming"],
      args: [
        {
          name: "user",
          type: ArgumentTypes.User,
          slashType: ApplicationCommandOptionType.User,
          required: true,
          description: "The user to ban"
        },
        {
          name: "duration",
          type: ArgumentTypes.Duration,
          slashType: ApplicationCommandOptionType.String,
          required: false,
          description: "The duration of the ban"
        },
        {
          name: "reason",
          type: ArgumentTypes.Text,
          slashType: ApplicationCommandOptionType.String,
          required: false,
          description: "The reason of the ban"
        },
        {
          name: "delete",
          type: ArgumentTypes.Flag,
          slashType: ApplicationCommandOptionType.Number,
          flagType: FlagTypes.Int,
          required: false,
          description: "Timespan (in days) from which to delete messages"
        }
      ],
      botPerms: [PermissionFlagsBits.BanMembers],
      userPerms: [PermissionFlagsBits.BanMembers],
      slash: true
    });
  }

  override async execute(
    msg: ActionMessage,
    args: {
      user: User;
      duration?: number;
      reason?: string;
      delete?: number;
    }
  ) {
    const res = await this.client.ban(msg.guild!, {
      mod: msg.member! as GuildMemberResolvable,
      victim: args.user,
      reason: args.reason,
      duration: args.duration,
      banDeleteDays: args.delete
    });

    msg.reply({
      embeds: [resEmbed(res)],
      allowedMentions: {
        parse: [],
        repliedUser: true
      }
    });
  }
}
