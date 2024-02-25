import { ArgumentTypes, Command, FlagTypes, resEmbed } from "#lib";
import {
  ApplicationCommandOptionType,
  CommandInteraction,
  GuildMemberResolvable,
  Message,
  PermissionFlagsBits,
  User
} from "discord.js";

export class Ban extends Command {
  constructor() {
    super("ban", {
      description: "Bans a user from the guild",
      aliases: ["ban"],
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
          description: "Delete messages this old from user"
        }
      ],
      botPerms: [PermissionFlagsBits.BanMembers],
      userPerms: [PermissionFlagsBits.BanMembers],
      slash: true
    });
  }

  override async execute(
    msg: Message | CommandInteraction,
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
