import { client } from "#src/bot.js";
import {
  CommandInteraction,
  GuildMember,
  Message,
  PermissionFlagsBits,
  channelMention,
  inlineCode
} from "discord.js";
import { Argument, ParsedArgs } from "../../types.js";
import { Client as ClientClass } from "../Client.js";

export interface CommandOptions {
  aliases: string[];
  description: string;
  usage?: string;
  category?: string;
  examples?: string[];
  args: Argument[];
  slash?: boolean;
  nsfw?: boolean;
  userPerms?: bigint[];
  botPerms?: bigint[];
  guildOnly?: boolean;
}

export abstract class Command {
  /** Unique ID of the command */
  public id: string;

  /** Description for the command, used in help command */
  public description: string;

  /** Does the command support interactions (slash commands) (default = true) */
  public slash: boolean;

  /** Aliases for the command (default = []) */
  public aliases: string[];

  /** Arguments for the command (default = []) */
  public arguments: Argument[];

  /** Is the command NSFW (default = false) */
  public nsfw: boolean;

  /** Permissions needed by the user (PermissionsFlagBits) (default = []) */
  public userPerms: bigint[];

  /** Permissions needed for the bot (PermissionsFlagBits) (default = SendMessages) */
  public botPerms: bigint[];

  /** Does the command only work inside of guilds (default = true) */
  public guildOnly: boolean;

  /** Category to which the command belongs */
  public category: string;

  /** Usage of the command, <arg> - required, [arg] - optional  */
  public usage: string;

  /** Usage examples */
  public examples: string[];

  /** Initialized client */
  public client: ClientClass = client;

  constructor(
    name: string,
    {
      description = "",
      slash = true,
      aliases = [],
      args = [],
      nsfw = false,
      userPerms = [],
      botPerms = [PermissionFlagsBits.SendMessages],
      guildOnly = true,
      usage = "",
      category = "",
      examples = []
    }: CommandOptions
  ) {
    this.id = name;
    this.description = description;
    this.slash = slash;
    this.aliases = aliases;
    this.arguments = args;
    this.nsfw = nsfw;
    this.userPerms = userPerms;
    this.botPerms = botPerms;
    this.guildOnly = guildOnly;
    this.usage = usage;
    this.category = category;
    this.examples = examples;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public execute(msg: Message | CommandInteraction, args: ParsedArgs) {
    throw new Error("Execute must be overriden. Command ID: " + this.id);
  }

  public async preExecute(msg: Message | CommandInteraction, args: ParsedArgs): Promise<boolean> {
    const cfg = await this.client.getGuildConfig(msg.guild!.id);
    if (
      cfg.commandChannels.length > 0 &&
      !cfg.commandChannels.includes(msg.channelId) &&
      !(msg.member as GuildMember)?.permissions.has(PermissionFlagsBits.ManageMessages)
    ) {
      if (msg instanceof CommandInteraction) {
        msg.reply({
          content: `Commands must be done in the following channels: ${cfg.commandChannels.map((c) => channelMention(c)).join(", ")}`,
          ephemeral: true
        });
      } else {
        msg.reply(
          `Commands must be done in the following channels: ${cfg.commandChannels.map((c) => channelMention(c)).join(", ")}`
        );
      }
      return true;
    }

    for (const arg of this.arguments) {
      if (!args[arg.name] && arg.required) {
        msg.reply("Invalid required argument: " + inlineCode(arg.name));
        return true;
      }
    }
    return false;
  }
}
