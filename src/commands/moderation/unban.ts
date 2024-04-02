import { ActionMessage, ArgumentTypes, Command, resEmbed } from "#lib";
import {
  ApplicationCommandOptionType,
  GuildMemberResolvable,
  PermissionFlagsBits,
  User
} from "discord.js";

export class Unban extends Command {
  constructor() {
    super("unban", {
      description: "Unbans a user from the guild",
      aliases: ["unban"],
      category: "moderation",
      usage: "unban <user> [reason]",
      examples: ["unban @oxi wrong ban duration"],
      args: [
        {
          name: "user",
          type: ArgumentTypes.User,
          slashType: ApplicationCommandOptionType.User,
          required: true,
          description: "The user to unban"
        },
        {
          name: "reason",
          type: ArgumentTypes.Text,
          slashType: ApplicationCommandOptionType.String,
          required: false,
          description: "The reason of the unban"
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
      reason?: string;
    }
  ) {
    const res = await this.client.unban(msg.guild!, {
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
