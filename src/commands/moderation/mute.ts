import { ArgumentTypes, Command, resEmbed } from "#lib";
import {
  ApplicationCommandOptionType,
  CommandInteraction,
  GuildMember,
  GuildMemberResolvable,
  Message,
  PermissionFlagsBits
} from "discord.js";

export class Mute extends Command {
  constructor() {
    super("mute", {
      description: "Mutes a member in the guild",
      aliases: ["mute"],
      args: [
        {
          name: "member",
          type: ArgumentTypes.Member,
          slashType: ApplicationCommandOptionType.User,
          required: true,
          description: "The member to mute"
        },
        {
          name: "duration",
          type: ArgumentTypes.Duration,
          slashType: ApplicationCommandOptionType.String,
          required: false,
          description: "The duration of the mute"
        },
        {
          name: "reason",
          type: ArgumentTypes.Text,
          slashType: ApplicationCommandOptionType.String,
          required: false,
          description: "The reason of the mute"
        }
      ],
      botPerms: [PermissionFlagsBits.MuteMembers],
      userPerms: [PermissionFlagsBits.MuteMembers],
      slash: true
    });
  }

  override async execute(
    msg: Message | CommandInteraction,
    args: {
      member: GuildMember;
      duration?: number;
      reason?: string;
    }
  ) {
    const res = await this.client.mute(msg.guild!, {
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
