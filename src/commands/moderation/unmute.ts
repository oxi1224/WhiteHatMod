import { ActionMessage, ArgumentTypes, Command, resEmbed } from "#lib";
import {
  ApplicationCommandOptionType,
  GuildMember,
  GuildMemberResolvable,
  PermissionFlagsBits
} from "discord.js";

export class Unmute extends Command {
  constructor() {
    super("unmute", {
      description: "Unmutes a member in the guild",
      aliases: ["unmute"],
      category: "moderation",
      usage: "unmute <user> [reason]",
      examples: ["unmute @oxi wrong duration"],
      args: [
        {
          name: "member",
          type: ArgumentTypes.Member,
          slashType: ApplicationCommandOptionType.User,
          required: true,
          description: "The member to unmute"
        },
        {
          name: "reason",
          type: ArgumentTypes.Text,
          slashType: ApplicationCommandOptionType.String,
          required: false,
          description: "The reason of the unmute"
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
      reason?: string;
    }
  ) {
    const res = await this.client.unmute(msg.guild!, {
      mod: msg.member! as GuildMemberResolvable,
      victim: args.member,
      reason: args.reason
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
