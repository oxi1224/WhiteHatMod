import { ArgumentTypes, Command, resEmbed } from "#lib";
import {
  ApplicationCommandOptionType,
  CommandInteraction,
  GuildMember,
  GuildMemberResolvable,
  Message
} from "discord.js";

export class Kick extends Command {
  constructor() {
    super("kick", {
      description: "Kicks a member from the guild",
      aliases: ["kick"],
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
