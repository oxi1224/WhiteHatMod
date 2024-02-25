import { ArgumentTypes, Command, resEmbed } from "#lib";
import {
  ApplicationCommandOptionType,
  CommandInteraction,
  GuildMemberResolvable,
  Message,
  PermissionFlagsBits,
  User
} from "discord.js";

export class Warn extends Command {
  constructor() {
    super("warn", {
      description: "Warns a user",
      aliases: ["warn"],
      category: "moderation",
      usage: "warn <user> <reason>",
      examples: ["warn @oxi swearing"],
      args: [
        {
          name: "user",
          type: ArgumentTypes.User,
          slashType: ApplicationCommandOptionType.User,
          required: true,
          description: "The user to warn"
        },
        {
          name: "reason",
          type: ArgumentTypes.Text,
          slashType: ApplicationCommandOptionType.String,
          required: false,
          description: "The reason of the warn"
        }
      ],
      botPerms: [PermissionFlagsBits.ManageMessages],
      userPerms: [PermissionFlagsBits.ManageMessages],
      slash: true
    });
  }

  override async execute(
    msg: Message | CommandInteraction,
    args: {
      user: User;
      reason?: string;
    }
  ) {
    const res = await this.client.warn(msg.guild!, {
      mod: msg.member! as GuildMemberResolvable,
      victim: args.user,
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
