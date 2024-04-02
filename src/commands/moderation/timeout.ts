import { ActionMessage, ArgumentTypes, Command, resEmbed } from "#lib";
import {
  ApplicationCommandOptionType,
  GuildMember,
  GuildMemberResolvable,
  PermissionFlagsBits
} from "discord.js";

export class Timeout extends Command {
  constructor() {
    super("timeout", {
      description: "Timeouts a member in the guild",
      aliases: ["timeout"],
      category: "moderation",
      usage: "timeout <user> [duration] [reason]",
      examples: ["timeout @oxi 1d spamming"],
      args: [
        {
          name: "member",
          type: ArgumentTypes.Member,
          slashType: ApplicationCommandOptionType.User,
          required: true,
          description: "The member to timeout"
        },
        {
          name: "duration",
          type: ArgumentTypes.Duration,
          slashType: ApplicationCommandOptionType.String,
          required: true,
          description: "The duration of the timeout"
        },
        {
          name: "reason",
          type: ArgumentTypes.Text,
          slashType: ApplicationCommandOptionType.String,
          required: false,
          description: "The reason of the timeout"
        }
      ],
      botPerms: [PermissionFlagsBits.MuteMembers],
      userPerms: [PermissionFlagsBits.MuteMembers],
      slash: true
    });
  }

  override async execute(
    msg: ActionMessage,
    args: {
      member: GuildMember;
      duration: number;
      reason?: string;
    }
  ) {
    const res = await this.client.timeout(msg.guild!, {
      mod: msg.member! as GuildMemberResolvable,
      victim: args.member,
      reason: args.reason,
      duration: args.duration
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
