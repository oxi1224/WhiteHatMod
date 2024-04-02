import { ActionMessage, ArgumentTypes, Command, colors } from "#lib";
import {
  ApplicationCommandOptionType,
  EmbedBuilder,
  PermissionFlagsBits,
  TextChannel,
  User,
  inlineCode,
  userMention
} from "discord.js";

export class Purge extends Command {
  constructor() {
    super("purge", {
      description: "Removes a specified number of messages",
      aliases: ["purge"],
      category: "moderation",
      usage: "purge <count> [user]",
      examples: ["purge 100 @oxi", "purge 100"],
      args: [
        {
          name: "count",
          type: ArgumentTypes.Int,
          slashType: ApplicationCommandOptionType.Number,
          required: true,
          description: "Amount of messages to search/remove (min: 0, max: 100)"
        },
        {
          name: "user",
          type: ArgumentTypes.User,
          slashType: ApplicationCommandOptionType.User,
          required: false,
          description: "The user whose messages will be removed"
        }
      ],
      botPerms: [PermissionFlagsBits.ManageMessages],
      userPerms: [PermissionFlagsBits.ManageMessages],
      slash: true
    });
  }

  override async execute(
    msg: ActionMessage,
    args: {
      count: number;
      user?: User;
    }
  ) {
    if (args.count < 1 || args.count > 100)
      return msg.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.error)
            .setDescription(
              `Invalid count provided (${inlineCode(args.count.toString())}), must be between 1 and 100}`
            )
        ]
      });

    let messages = await msg.channel!.messages.fetch({
      before: msg.id,
      limit: args.count
    });
    if (args.user) messages = messages.filter((_msg) => _msg.author.id === args.user?.id);
    if (args.user && messages.size === 0)
      return msg.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.info)
            .setDescription(
              `No messages from ${userMention(args.user.id)} found in specified range`
            )
        ]
      });

    try {
      await (msg.channel as TextChannel).bulkDelete(messages);
      msg.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.success)
            .setDescription(`Successfully removed ${inlineCode(messages.size.toString())} messages`)
        ]
      });
      this.client.emit(
        "punishmentAdd",
        msg.guild!,
        {
          type: "PURGE",
          victim: args.user,
          moderator: msg.member,
          reason: `Removed messages: ${messages.size}`
        },
        false
      );
    } catch (e) {
      process.emit("unhandledRejection" as any, e as Error); // Will get handled by unhandledRejection listener
      msg.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.error)
            .setDescription("An error has occured while deleting messages")
        ]
      });
    }
    return;
  }
}
