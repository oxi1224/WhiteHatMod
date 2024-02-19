import { client } from "#src/bot.js";
import { CommandInteraction, Message, PermissionFlagsBits, inlineCode } from "discord.js";
import { Argument, ParsedArgs } from "../types.js";
import { Client as ClientClass } from "./Client.js";

export interface CommandOptions {
  aliases: string[];
  description: string;
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
      guildOnly = true
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
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public execute(msg: Message | CommandInteraction, args: ParsedArgs) {
    throw new Error("Execute must be overriden. Command ID: " + this.id);
  }

  public preExecute(msg: Message | CommandInteraction, args: ParsedArgs): boolean {
    for (const arg of this.arguments) {
      if (!args[arg.name] && arg.required) {
        msg.reply("Invalid required argument: " + inlineCode(arg.name));
        return true;
      }
    }
    return false;
  }
}
