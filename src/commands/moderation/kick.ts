import { ArgumentTypes, Command, resEmbed } from "#lib";
import {
  ApplicationCommandOptionType,
  CommandInteraction,
  GuildMember,
  GuildMemberResolvable,
  Message,
  PermissionFlagsBits
} from "discord.js";

export class Kick extends Command {
  constructor() {
    super("kick", {
      description: "Kicks a member from the guild",
      aliases: ["kick"],
      category: "moderation",
      usage: "kick <user> [reason]",
      examples: ["kick @oxi spamming"],
      args: [
        {
          name: "member",
          type: ArgumentTypes.Member,
          slashType: ApplicationCommandOptionType.User,
          required: true,
          description: "The member to kick"
        },
        {
          name: "reason",
          type: ArgumentTypes.Text,
          slashType: ApplicationCommandOptionType.String,
          required: false,
          description: "The reason of the kick"
        }
      ],
      botPerms: [PermissionFlagsBits.KickMembers],
      userPerms: [PermissionFlagsBits.KickMembers],
      slash: true
    });
  }

  override async execute(
    msg: Message | CommandInteraction,
    args: {
      member: GuildMember;
      reason?: string;
    }
  ) {
    const res = await this.client.kick(msg.guild!, {
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
