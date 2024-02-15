import {
  APIApplicationCommandOptionChoice,
  ApplicationCommandOptionType,
  CommandInteraction,
  Message,
  PermissionFlagsBits,
} from "discord.js";

export const enum ArgumentTypes {
  User,
  Channel,
  Role,
  Text,
  Number,
  Duration
}

export interface Argument {
  name: string;
  description: string;
  required: boolean;
  type: ArgumentTypes;
  slashType: ApplicationCommandOptionType;
  choices: APIApplicationCommandOptionChoice<number | string>[];
}

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
  public execute(msg: Message | CommandInteraction) {
    throw new Error("Execute must be overriden");
  }
}
