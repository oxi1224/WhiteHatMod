import {
  ArgumentTypes,
  Command,
  GuildConfigKeys,
  arrayTypeKeys,
  colors,
  guildConfigKeys
} from "#lib";
import { ApplicationCommandOptionType } from "discord-api-types/v10";
import {
  CommandInteraction,
  EmbedBuilder,
  Message,
  PermissionFlagsBits,
  Snowflake,
  channelMention,
  inlineCode,
  roleMention
} from "discord.js";

export class Config extends Command {
  constructor() {
    super("config", {
      aliases: ["config", "cfg"],
      description: "Changes the guilds config",
      usage: "config <function> <key> [new_value]",
      examples: [
        "config set moderationLogChannel #modlogs",
        "config add commandChannels #bot-commands",
        "config remove commandChannels #bot-commands",
        "config clear joinRoles",
        "config show mutedRole"
      ],
      category: "admin",
      args: [
        {
          name: "function",
          type: ArgumentTypes.Text,
          slashType: ApplicationCommandOptionType.String,
          description: "The function to perform",
          required: true,
          choices: [
            { name: "set", value: "set" },
            { name: "clear", value: "clear" },
            { name: "show", value: "show" },
            { name: "add", value: "add" },
            { name: "remove", value: "remove" }
          ],
          word_length: 1
        },
        {
          name: "key",
          type: ArgumentTypes.Text,
          slashType: ApplicationCommandOptionType.String,
          description: "The key to change (case sensitive!)",
          required: true,
          choices: Object.keys(guildConfigKeys).map((k) => ({ name: k, value: k })),
          word_length: 1
        },
        {
          name: "new_value",
          type: ArgumentTypes.Text,
          slashType: ApplicationCommandOptionType.String,
          description: "The new value",
          required: false
        }
      ],
      slash: true,
      userPerms: [PermissionFlagsBits.ManageGuild]
    });
  }

  public override async execute(
    msg: Message | CommandInteraction,
    args: {
      function: "set" | "clear" | "show" | "add" | "remove";
      key: GuildConfigKeys;
      new_value?: string;
    }
  ) {
    if (!Object.keys(guildConfigKeys).includes(args.key))
      return msg.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.error)
            .setTitle("Invalid Key")
            .setDescription(
              `Valid keys are: ${Object.keys(guildConfigKeys)
                .map((k) => inlineCode(k))
                .join(", ")}`
            )
        ]
      });
    if (
      !arrayTypeKeys.includes(args.key) &&
      (args.function === "add" || args.function === "remove")
    )
      return msg.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.error)
            .setTitle("Invalid Function")
            .setDescription(
              `${inlineCode(args.function)} may only be used with array type config options`
            )
        ]
      });

    if (!(args.function == "show" || args.function == "clear") && !args.new_value)
      return msg.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.error)
            .setTitle("No value given")
            .setDescription("A value must be provided if not using the show function")
        ]
      });

    const cfg = await this.client.getGuildConfig(msg.guild!);
    const keyType = guildConfigKeys[args.key];
    const keyValue: Snowflake[] | string | null = cfg[args.key];
    args.new_value = args.new_value?.replace(/[\\<>@&#]/g, "");

    if (args.function === "show") {
      let desc = "No value";
      if (Array.isArray(keyValue) && keyValue.length > 0) {
        if (keyType === "channel") desc = keyValue.map((ch) => channelMention(ch)).join(", ");
        if (keyType === "role") desc = keyValue.map((rl) => roleMention(rl)).join(", ");
        if (keyType === "string") desc = keyValue.map((str) => inlineCode(str)).join(", ");
      } else if (!Array.isArray(keyValue) && keyValue) {
        if (keyType === "channel") desc = channelMention(keyValue);
        if (keyType === "role") desc = roleMention(keyValue);
        if (keyType === "string") desc = inlineCode(keyValue);
      }

      return msg.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.success)
            .setTitle(`Value of ${inlineCode(args.key)}`)
            .setDescription(desc)
        ],
        allowedMentions: {
          parse: [],
          repliedUser: true
        }
      });
    }

    let showErrorMsg = false;
    if (keyType === "channel") {
      const val = await msg.guild!.channels.fetch(args.new_value!).catch(() => null);
      if (!val) showErrorMsg = true;
    } else if (keyType === "role") {
      const val = await msg.guild!.roles.fetch(args.new_value!).catch(() => null);
      if (!val) showErrorMsg = true;
    }

    if (showErrorMsg)
      return msg.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.error)
            .setTitle("Invalid value provided")
            .setDescription(
              `Key ${inlineCode(args.key)} requires value of type: ${inlineCode(keyType)}`
            )
        ]
      });

    if (args.function === "clear") {
      // @ts-expect-error weird typing stuff, this will work.
      if (Array.isArray(cfg[args.key])) cfg[args.key] = [];
      // @ts-expect-error weird typing stuff, this will work.
      else cfg[args.key] = null;
    } else if (Array.isArray(cfg[args.key])) {
      let value = cfg[args.key] as string[];
      if (args.function === "add") value.push(args.new_value!);
      if (args.function === "remove") {
        const idx = value.findIndex((s) => s === args.new_value);
        if (idx) value.splice(idx, 1);
      }
      if (args.function === "set") value = [args.new_value!];
      // @ts-expect-error weird typing stuff, this will work.
      cfg[args.key] = value;
    } else {
      let value = cfg[args.key] as unknown;
      if (args.function === "set") value = args.new_value!;
      // @ts-expect-error weird typing stuff, this will work.
      cfg[args.key] = value;
    }
    await cfg.save();
    msg.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(colors.success)
          .setTitle("Successfully updated")
          .setDescription(`Successfully changed ${inlineCode(args.key)}`)
          .setFooter({ text: `Use the show function to display the key's value` })
      ]
    });
    return;
  }
}
