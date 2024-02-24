import { ArgumentTypes, Command, resEmbed } from "#lib";
import {
  ApplicationCommandOptionType,
  CommandInteraction,
  GuildMember,
  GuildMemberResolvable,
  Message
} from "discord.js";

export class Timeout extends Command {
  constructor() {
    super("timeout", {
      description: "Timeouts a member in the guild",
      aliases: ["timeout"],
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
      slash: true
    });
  }

  override async execute(
    msg: Message | CommandInteraction,
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
