import { ArgumentTypes, Command, resEmbed } from "#lib";
import {
  ApplicationCommandOptionType,
  CommandInteraction,
  GuildMember,
  GuildMemberResolvable,
  Message
} from "discord.js";

export class Untimeout extends Command {
  constructor() {
    super("untimeout", {
      description: "Removes timeout from a member in the guild",
      aliases: ["untimeout"],
      args: [
        {
          name: "member",
          type: ArgumentTypes.Member,
          slashType: ApplicationCommandOptionType.User,
          required: true,
          description: "The member to untimeout"
        },
        {
          name: "reason",
          type: ArgumentTypes.Text,
          slashType: ApplicationCommandOptionType.String,
          required: false,
          description: "The reason of the untimeout"
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
    const res = await this.client.untimeout(msg.guild!, {
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
