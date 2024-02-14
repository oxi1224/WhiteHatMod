import {
  APIApplicationCommandOptionChoice,
  ApplicationCommandOptionType,
  CommandInteraction,
  Message
} from "discord.js";

export enum ArgumentTypes {
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
}

export abstract class Command {
  public id: string;
  public description: string;
  public slash: boolean;
  public aliases: string[];
  public arguments: Argument[];
  public nsfw: boolean;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(
    name: string,
    {
      description = "",
      slash = true,
      aliases = [],
      args = [],
      nsfw = false
    }: CommandOptions
  ) {
    this.id = name;
    this.description = description;
    this.slash = slash;
    this.aliases = aliases;
    this.arguments = args;
    this.nsfw = nsfw;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public execute(msg: Message | CommandInteraction) {
    throw new Error("Execute must be overriden");
  }
}
