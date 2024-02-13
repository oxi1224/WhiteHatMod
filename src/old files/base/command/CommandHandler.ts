import 'dotenv/config';
import { EventEmitter } from 'events';
import { Interaction, Message, SlashCommandBuilder, InteractionType, GuildMember } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { BaseCommand } from '../command/Command.js';
import { slashOptions } from '../lib/constants.js';
import type { CommandHandlerOptions, ClassConstructor, ParsedArgs } from '../lib/types.js';
import { CustomClient } from '../CustomClient.js';

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN ?? '');

export class BaseCommandHandler extends EventEmitter {
  /**
   * Array of commands to handle.
   */
  public commandArray: BaseCommand[] = [];

  /**
   * Path to the file containing exports of all classes.
   */
  private exportFileDirectory: string;

  /**
   * The prefix for commands.
   */
  public prefix: string;

  /**
   * The client of the handler.
   */
  public client: CustomClient;

  /**
   * The regex which determines if a value is a flag.
   */
  public flagRegex: RegExp;

  /**
   * The regex for replacing characters in command alias.
   */
  public aliasReplacement: RegExp | undefined;

  /**
   * @param client - Client object.
   * @param options - Options.
   */
  constructor(client: CustomClient, {
    commandExportFile,
    prefix = '!',
    flagRegex = /--.+/,
    aliasReplacement,
  }: CommandHandlerOptions) {
    super();
    this.client = client;
    this.exportFileDirectory = commandExportFile;
    this.prefix = prefix;
    this.flagRegex = flagRegex;
    this.aliasReplacement = aliasReplacement;
  }
  
  /**
   * Imports everything from exportFileDirectory, turns the commands into classes and pushes them to commandArray.
   */
  private async loadAll() {
    const imports: { [key: string]: ClassConstructor<BaseCommand> } = await import(this.exportFileDirectory);
    Object.entries(imports)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .forEach(([key, command]) => {
        const cmd = new command();
        if (this.commandArray.find(c => c.id === cmd.id)) throw new Error(`Command IDs must be unique. (${cmd.id})`);
        this.commandArray.push(cmd);
      });
    await this.loadSlash();
  }

  /**
   * Loads all commands which have the slash option set to true.
   */
  public async loadSlash() {
    const slashCommands: SlashCommandBuilder[] = [];
    this.commandArray.filter(cmd => cmd.slash);
    this.commandArray.forEach(command => {
      const name = command.id;
      const args = command.argumentArray;
      const description = command.description;
      const slashCommand = new SlashCommandBuilder();
  
      if (name) slashCommand.setName(name);
      if (description) slashCommand.setDescription(description);
      if (args.length !== 0) 
        args.forEach(arg => {
          slashOptions[arg.slashType?.toString() as keyof typeof slashOptions](slashCommand, arg);
        });
      slashCommands.push(slashCommand);
      this.emit('slashInit', slashCommand);
    });

    if (!process.env.CLIENT_ID) this.client.destroy();
    await rest.put(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      Routes.applicationCommands(process.env.CLIENT_ID!),
      { body: slashCommands },
    ).catch(e => console.error(e));
    this.emit('slashLoad');
  }

  /**
   * Starts the command listeners.
   */
  public async start() {
    await this.loadAll();
    this.client.on('messageCreate', (message: Message) => { this.handle(message); });
    this.client.on('interactionCreate', async (interaction: Interaction) => { this.handleSlash(interaction); });
  }

  public async handle(message: Message): Promise<unknown> {
    if (!message.guild?.available) return;
    if (!message.content.startsWith(this.prefix) || message.author.bot) return;

    const commandName = message.content.split(' ').shift()?.replace('!', '');
    if (this.aliasReplacement) commandName?.replace(this.aliasReplacement, '');
    const command = this.commandArray.find(cmd => cmd.aliases.includes(commandName ?? ''));
    if (!command) return;

    if (!message.member?.permissions.has(command.userPermissions)) return;
    const args: ParsedArgs | null = await command.parseArgs(message, command.argumentArray);
    return command.execute(message, args);
  } 

  public async handleSlash(interaction: Interaction): Promise<unknown> {
    if (!(interaction.type === InteractionType.ApplicationCommand)) return;
    if (!interaction.guild?.available) return;

    const commandName = interaction.commandName;
    const command = this.commandArray.find(cmd => cmd.aliases.includes(commandName));
    if (!command) return;

    if (!((interaction.member as GuildMember).permissions.has(command.userPermissions))) return interaction.reply({ content: 'Insufficient Permissions', ephemeral: true });
    const args: ParsedArgs | null = await command.parseArgs(interaction, command.argumentArray);
    return command.execute(interaction, args);
  }
}