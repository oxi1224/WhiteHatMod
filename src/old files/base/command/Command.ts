import { PermissionFlagsBits } from "discord-api-types/v10";
import { type Message, CommandInteraction, PermissionResolvable } from "discord.js";
import { Argument } from "./Argument.js";
import { regex } from "../lib/constants.js";
import type { CommandArgument, CommandArgumentType, CommandOptions, Duration, ParsedArgs } from "../lib/types.js";
import { parseDuration } from "../lib/util/parseDuration.js";
import { BaseCommandHandler } from "./CommandHandler.js";

export abstract class BaseCommand {
  /**
   * Unique id of the command.
   */
  public id: string;

  /**
   * Aliases that trigger the command.
   */
  public aliases: string[];

  /**
   * Arguments for the command.
   */
  public args: CommandArgument[];

  /**
   * Required permissions to use the command.
   */
  public userPermissions: PermissionResolvable;

  /**
   * Required permissions for the bot.
   */
  public clientPermissions: bigint[];
  /**
   * Description of the command.
   */
  public description: string;

  /**
   * Whether or not the command supports interactions.
   */
  public slash: boolean;

  /**
   * Usage templte of the command.
   */
  public usage: string;

  /**
   * Examples of how the command should be used.
   */
  public examples: string[];

  /**
   * The category the command belongs to.
   */
  public category: string;

  /**
   * Array of argument classes.
   */
  public argumentArray: Argument[];

  /**
   * Number of flags the command includes.
   */
  public flagCount: number;

  /**
   * The command handler of the command.
   */
  public commandHandler?: BaseCommandHandler;

  /**
   * Extra info to display about the command when running help.
   */
  public extraInfo?: string;

  /**
   * @param id - Unique id of the command
   * @param options - Options 
   */
  constructor(id: string, {
    aliases,
    args = [],
    userPermissions = PermissionFlagsBits.SendMessages,
    clientPermissions = [PermissionFlagsBits.SendMessages],
    description = '',
    usage,
    examples,
    category,
    slash = true,
    extraInfo,
  }: CommandOptions) {
    this.id = id;
    this.aliases = aliases;
    this.args = args;
    this.userPermissions = userPermissions;
    this.clientPermissions = clientPermissions;
    this.description = description;
    this.slash = slash;
    this.usage = usage;
    this.examples = examples;
    this.category = category;
    this.argumentArray = this.initArgs(args);
    this.flagCount = (this.argumentArray.filter(arg => arg.type === 'flag')).length;
    this.extraInfo = extraInfo;
  }

  /**
   * The function to run when the command is executed.
   * @param message - Discord.js Message or CommandInteraction object.
   * @param args - Parsed arguments for the command.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public execute(message: Message | CommandInteraction, args: ParsedArgs | null): void {
    throw new Error(`Execute function empty in ${this.id} command.`);
  }

  /**
   * The function to run when the slash command is executed
   * @param interaction - Discord.js CommandInteraction object.
   * @param args - Parsed arguments for the command.
   */
  public executeSlash(interaction: CommandInteraction, args: ParsedArgs | null): void {
    this.execute(interaction, args);
  }

  /**
   * Parses the command's args into array of argument classes.
   * @param args - Args to get parsed into classes.
   * @returns Array of arguments represented as classes.
   */
  private initArgs(args: CommandArgument[]): Argument[] {
    const argArray: Argument[] = [];
    args.forEach(arg => {
      argArray.push(new Argument(this, arg));
    });
    return argArray;
  }

  /**
   * Parses arguments into values from a message, when a CommandInteraction is passed, executes parseSlash.
   * @param message - Discord.js Message or CommandInteraction object.
   * @param argumentArray - The arguments to parse.
   * @returns Parsed command arguments.
   */
  public async parseArgs(message: Message | CommandInteraction, argumentArray: Argument[]): Promise<ParsedArgs | null> {
    if (message instanceof CommandInteraction) return this.parseSlash(message, argumentArray);
    const contentArray: string[] = message.content.split(' ');
    contentArray.filter(str => str !== ' ');
    contentArray.shift();
    if (!contentArray) return null;
    const args: ParsedArgs = {};
    for (let i = 0; i < argumentArray.length; i++) {
      const arg = argumentArray[i];

      if (arg.type !== 'string' && arg.length !== Infinity) throw new Error('The length property may only appear with string type');
      let value: ParsedArgs[keyof ParsedArgs];
      if (contentArray[arg.index]) {
        switch (arg.type as CommandArgumentType) {
        case 'user':
          if (!contentArray[arg.index].match(regex.user)) {value = null; break;}
          value = await message.client.users.fetch(contentArray[arg.index].replace(/[\\<>@#&!]/g, '')).catch(() => null);
          break;
        case 'channel':
          if (!contentArray[arg.index].match(regex.channel)) {value = null; break;}
          value = await message.guild?.channels.fetch(contentArray[arg.index].replace(/[\\<>@#&!]/g, '')).catch(() => null);
          break;
        case 'role':
          value = await message.guild?.roles.fetch(contentArray[arg.index].replace(/[\\<>@#&!]/g, '')).catch(() => null) 
            ?? message.guild?.roles.cache.find(role => role.name === contentArray[arg.index].replace(/[\\<>@#&!]/g, '')) ?? null;
          break;
        case 'string':
          value = contentArray.slice(arg.index, arg.index + arg.length).filter(str => !this.commandHandler?.flagRegex.test(str)).join(' '); 
          break;
        case 'integer':
          value = parseInt(contentArray[arg.index]);
          break;
        case 'number':
          value = parseFloat(contentArray[arg.index]);
          break;
        case 'boolean':
          if (contentArray[arg.index] === 'true') {value = (contentArray[arg.index] === 'true'); break;}
          if (contentArray[arg.index] === 'false') {value = !(contentArray[arg.index] === 'false'); break;}
          value = null;
          break;
        case 'duration':
          const stringOne = contentArray[arg.index];
          const stringTwo = contentArray.slice(arg.index, arg.index + 2).join('');
          const matchingDuration = regex.duration.test(stringOne) ? stringOne : regex.duration.test(stringTwo) ? stringTwo : null;
          const timestamp = parseDuration(matchingDuration as Duration, new Date().getTime());
          const val = {
            raw: matchingDuration,
            timestamp: timestamp
          };
          value = !val.raw || !val.timestamp ? null : val;
          if (regex.duration.test(stringTwo)) contentArray.splice(arg.index, 1);
          break;
        case 'flag':
          value = contentArray.find(str => this.commandHandler?.flagRegex.test(str)) ?? null;
          if (value) contentArray.splice(contentArray.indexOf(value), 1);
          break;
        default:
          value = 'null';
          break;
        }
      } else { value = null; }
      
      args[arg.id] = value;
      let newIndex = i;
      newIndex++;
      if (!value && !arg.required && argumentArray[newIndex] !== undefined) argumentArray[newIndex].index = i;
      argumentArray[i].index = i;
    }
    return args;
  }

  /**
   * Parses interaction arguments into values.
   * @param interaction - Discord.js CommandInteraction object.
   * @param argumentArray - The arguments to parse.
   * @returns Parsed command arguments.
   */
  public parseSlash(interaction: CommandInteraction, argumentArray: Argument[]): ParsedArgs | null {
    const args: ParsedArgs = {};
    argumentArray.forEach(arg => {
      if (['user', 'channel', 'role'].includes(arg.type)) return args[arg.id] = interaction.options.get(arg.id);
      if (arg.type === 'duration') return args[arg.id] = parseDuration(
        interaction.options.get(arg.id)?.value as Duration,
        new Date().getTime()
      );
      return args[arg.id] = interaction.options.get(arg.id)?.value;
    });
    return args;
  }
}