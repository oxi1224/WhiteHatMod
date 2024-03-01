import { getMissingPermNames, parseDuration } from "#util";
import {
  ApplicationCommandOptionType,
  Collection,
  CommandInteraction,
  EmbedBuilder,
  Guild,
  GuildMember,
  Message,
  REST,
  Routes,
  SlashCommandBuilder,
  inlineCode
} from "discord.js";
import "dotenv/config";
import { EventEmitter } from "events";
import { ArgumentTypes, FlagTypes, colors, emotes } from "../../constants.js";
import { ArgTypes, Argument, ClassConstructor, ParsedArgs } from "../../types.js";
import { Client } from "../Client.js";
import { Command } from "./Command.js";

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN ?? "");

export interface CommandHandlerOptions {
  prefix: string;
  commandPath: string;
  flagPrefix: string;
}

export class CommandHandler extends EventEmitter {
  public prefix: string;
  public client: Client;
  public flagPrefix: string;

  public commands = new Collection<string, Command>();
  private commandExportPath: string;
  constructor(client: Client, options: CommandHandlerOptions) {
    super();
    this.client = client;
    this.prefix = options.prefix;
    this.commandExportPath = options.commandPath;
    this.flagPrefix = options.flagPrefix;
  }

  public async start() {
    await this.load();
    this.client.addListener("messageCreate", (msg: Message) => this.handleMessage(msg));
    this.client.addListener("interactionCreate", (interaction: CommandInteraction) =>
      this.handleInteraction(interaction)
    );
  }

  public async load() {
    const slashBuilders: SlashCommandBuilder[] = [];
    const imported: { [key: string]: ClassConstructor<Command> } = await import(
      this.commandExportPath
    );

    for (const constructor of Object.values(imported)) {
      const cmd = new constructor();
      this.emit("commandLoadStart", cmd.id);
      if (this.commands.has(cmd.id)) {
        throw new Error("Commands cannot have the same ID");
      }

      this.commands.set(cmd.id, cmd);
      if (cmd.slash) slashBuilders.push(this.initSlash(cmd));
      this.emit("commandLoad", cmd.id);
    }
    await rest
      .put(Routes.applicationCommands(process.env.CLIENT_ID ?? ""), {
        body: slashBuilders.map((b) => b.toJSON())
      })
      .catch((e) => console.error(e));
    this.emit("commandsLoaded");
  }

  private initSlash(data: Command): SlashCommandBuilder {
    const builder = new SlashCommandBuilder()
      .setName(data.id)
      .setDescription(data.description)
      .setNSFW(data.nsfw);

    /* eslint-disable indent */
    data.arguments.forEach((arg) => {
      switch (arg.slashType) {
        case ApplicationCommandOptionType.Attachment:
          builder.addAttachmentOption((opt) =>
            opt.setName(arg.name).setDescription(arg.description).setRequired(arg.required)
          );
          break;
        case ApplicationCommandOptionType.Boolean:
          builder.addBooleanOption((opt) =>
            opt.setName(arg.name).setDescription(arg.description).setRequired(arg.required)
          );
          break;
        case ApplicationCommandOptionType.Channel:
          builder.addChannelOption((opt) =>
            opt.setName(arg.name).setDescription(arg.description).setRequired(arg.required)
          );
          break;
        case ApplicationCommandOptionType.Integer:
          builder.addIntegerOption((opt) =>
            opt
              .setName(arg.name)
              .setDescription(arg.description)
              .setRequired(arg.required)
              // @ts-expect-error AddChoice also works with addStringOption() and addNumberOption(), should be set correctly by developer
              .addChoices(...arg.choices)
          );
          break;
        case ApplicationCommandOptionType.Mentionable:
          builder.addMentionableOption((opt) =>
            opt.setName(arg.name).setDescription(arg.description).setRequired(arg.required)
          );
          break;
        case ApplicationCommandOptionType.Number:
          builder.addNumberOption((opt) =>
            opt
              .setName(arg.name)
              .setDescription(arg.description)
              .setRequired(arg.required)
              // @ts-expect-error AddChoice also works with addStringOption() and addNumberOption(), should be set correctly by developer
              .addChoices(...(arg.choices || []))
          );
          break;
        case ApplicationCommandOptionType.Role:
          builder.addRoleOption((opt) =>
            opt.setName(arg.name).setDescription(arg.description).setRequired(arg.required)
          );
          break;
        case ApplicationCommandOptionType.String:
          builder.addStringOption((opt) =>
            opt
              .setName(arg.name)
              .setDescription(arg.description)
              .setRequired(arg.required)
              // @ts-expect-error AddChoice also works with addStringOption() and addNumberOption(), should be set correctly by developer
              .addChoices(...(arg.choices || []))
          );
          break;
        case ApplicationCommandOptionType.User:
          builder.addUserOption((opt) =>
            opt.setName(arg.name).setDescription(arg.description).setRequired(arg.required)
          );
          break;
      }
    });
    /* eslint-disable indent */
    return builder;
  }

  public async handleMessage(msg: Message) {
    if (msg.author.id == process.env.CLIENT_ID) return;
    if (!msg.content.startsWith(this.prefix)) return;

    const spaceIdx = msg.content.indexOf(" ") > 0 ? msg.content.indexOf(" ") : 0;
    const command = msg.content.substring(1, spaceIdx || msg.content.length);
    const commandObject = this.commands.find((entry) => entry.aliases.includes(command));
    if (commandObject) {
      if ((!msg.inGuild() || !msg.member) && commandObject.guildOnly) return;
      const userPerms = getMissingPermNames(msg.member!, commandObject.userPerms);
      const botMember: GuildMember = await msg.guild!.members.fetchMe();
      const botPerms = getMissingPermNames(botMember, commandObject.botPerms);

      const errEmbed = new EmbedBuilder().setColor(colors.info);
      if (userPerms.length > 0) {
        errEmbed.setDescription(
          emotes.info +
            "You are missing the following permissions: " +
            inlineCode(userPerms.join(", "))
        );
        return msg.reply({ embeds: [errEmbed] });
      }
      if (botPerms.length > 0) {
        errEmbed.setDescription(
          emotes.info + "I am missing the following permissions: " + inlineCode(botPerms.join(", "))
        );
        return msg.reply({ embeds: [errEmbed] });
      }
      const commandContent = msg.content.substring((spaceIdx || msg.content.length) + 1);
      const args = await this.parseCommandArgs(
        commandContent.trim(),
        commandObject.arguments,
        msg.guild!
      );
      const stopExecution = commandObject.preExecute(msg, args);
      if (stopExecution) return;
      commandObject.execute(msg, args);
    }
    return;
  }

  public async handleInteraction(interaction: CommandInteraction) {
    if (this.commands.has(interaction.commandName)) {
      const cmd = this.commands.get(interaction.commandName)!;
      if (!interaction.inGuild() && cmd.guildOnly) return;
      const userPerms = getMissingPermNames(interaction.member! as GuildMember, cmd.userPerms);
      const botMember: GuildMember = await interaction.guild!.members.fetchMe();
      const botPerms = getMissingPermNames(botMember, cmd.botPerms);

      const errEmbed = new EmbedBuilder().setColor(colors.info);
      if (userPerms.length > 0) {
        errEmbed.setDescription(
          emotes.info +
            "You are missing the following permissions: " +
            inlineCode(userPerms.join(", "))
        );
        return interaction.reply({ embeds: [errEmbed], ephemeral: true });
      }
      if (botPerms.length > 0) {
        errEmbed.setDescription(
          emotes.info + "I am missing the following permissions: " + inlineCode(botPerms.join(", "))
        );
        return interaction.reply({ embeds: [errEmbed] });
      }
      const args = this.parseInteractionArgs(interaction, cmd.arguments);
      const stopExecution = cmd.preExecute(interaction, args);
      if (stopExecution) return;
      cmd.execute(interaction, args);
    }
    return;
  }

  private async parseCommandArgs(
    contents: string,
    args: Argument[],
    guild: Guild
  ): Promise<ParsedArgs> {
    // Change multiple whitespaces into one space
    contents = contents.replace(/\s+/g, " ");
    const parsed: ParsedArgs = {};
    for (const arg of args) {
      const spaceIdx = contents.indexOf(" ") > 0 ? contents.indexOf(" ") : contents.length;
      const flagIdx =
        contents.indexOf(this.flagPrefix) >= 0
          ? contents.indexOf(this.flagPrefix)
          : contents.length;
      let setValue: ArgTypes = null;
      let tempVal: string;

      switch (arg.type) {
        case ArgumentTypes.User:
          tempVal = contents.substring(0, spaceIdx).replace(/[\\<>@]/g, "");
          setValue = await guild.client.users.fetch(tempVal).catch(() => null);
          if (setValue) contents = contents.substring(spaceIdx + 1);
          break;
        case ArgumentTypes.Member:
          tempVal = contents.substring(0, spaceIdx).replace(/[\\<>@]/g, "");
          setValue = await guild.members.fetch(tempVal).catch(() => null);
          if (setValue) contents = contents.substring(spaceIdx + 1);
          break;
        case ArgumentTypes.Channel:
          tempVal = contents.substring(0, spaceIdx).replace(/[\\<>#]/g, "");
          setValue = await guild.channels.fetch(tempVal).catch(() => null);
          if (setValue) contents = contents.substring(spaceIdx + 1);
          break;
        case ArgumentTypes.Role:
          tempVal = contents.substring(0, spaceIdx).replace(/[\\<>@&]/g, "");
          setValue = await guild.roles.fetch(tempVal).catch(() => null);
          if (setValue) contents = contents.substring(spaceIdx + 1);
          break;
        case ArgumentTypes.Text:
          const nthSpacePos = arg.word_length
            ? contents.split(" ", arg.word_length).join(" ").length
            : null;
          setValue = contents.substring(0, nthSpacePos || flagIdx).trim();
          if (setValue) contents = contents.substring(nthSpacePos ? nthSpacePos + 1 : flagIdx);
          break;
        case ArgumentTypes.Int:
          tempVal = contents.substring(0, spaceIdx);
          setValue = isNaN(parseInt(tempVal)) ? null : parseInt(tempVal);
          if (setValue) contents = contents.substring(spaceIdx + 1);
          break;
        case ArgumentTypes.Number:
          tempVal = contents.substring(0, spaceIdx);
          setValue = isNaN(parseFloat(tempVal)) ? null : parseFloat(tempVal);
          if (setValue) contents = contents.substring(spaceIdx + 1);
          break;
        case ArgumentTypes.Bool:
          tempVal = contents.substring(0, spaceIdx);
          setValue = tempVal === "true";
          if (setValue || setValue === false) contents = contents.substring(spaceIdx + 1);
          break;
        case ArgumentTypes.Duration:
          tempVal = contents.match(/[0-9]+ ?[a-zA-Z]+/g)?.at(0) || "";
          setValue = parseDuration(tempVal);
          if (setValue) contents = contents.substring(tempVal.length + 1);
          break;
        case ArgumentTypes.Flag:
          tempVal = contents.substring(this.flagPrefix.length, spaceIdx); // flag name
          if (!tempVal || tempVal !== arg.name) {
            setValue = null;
            break;
          }
          if (arg.flagType === FlagTypes.Bool) {
            if (tempVal === arg.name) setValue = true;
            else setValue = false;
            contents = contents.substring(this.flagPrefix.length, spaceIdx + 1);
            break;
          }
          /**
           * In the following comments:
           * _ = space
           * => = turns into
           * ... = rest of string
           */
          tempVal = contents.substring(this.flagPrefix.length + arg.name.length); // --reason_some_thing_... => _some_thing_...
          tempVal = tempVal.trimStart(); // _some_thing_... => some_thing_...
          const nextFlagIdx =
            tempVal.indexOf(this.flagPrefix) >= 0
              ? tempVal.indexOf(this.flagPrefix)
              : tempVal.length;
          const flagValue = tempVal.substring(0, nextFlagIdx); // some_thing_... => some_thing
          tempVal = tempVal.substring(nextFlagIdx); // some_thing_... => ...
          if (arg.flagType === FlagTypes.Int) {
            setValue = parseInt(flagValue);
          } else if (arg.flagType === FlagTypes.Number) {
            setValue = parseFloat(flagValue);
          } else if (arg.flagType === FlagTypes.String) {
            setValue = flagValue;
          }
          if (setValue) contents = tempVal;
          break;
        default:
          break;
      }
      parsed[arg.name] = setValue;
    }
    return parsed;
  }

  private parseInteractionArgs(interaction: CommandInteraction, args: Argument[]): ParsedArgs {
    const parsed: ParsedArgs = {};
    args.forEach((arg) => {
      switch (arg.slashType) {
        case ApplicationCommandOptionType.String:
          const val = interaction.options.get(arg.name, arg.required)?.value;
          if (arg.type === ArgumentTypes.Duration) {
            parsed[arg.name] = parseDuration((val as string | undefined) || "");
          } else {
            parsed[arg.name] = val || null;
          }
          break;
        case ApplicationCommandOptionType.Number:
        case ApplicationCommandOptionType.Boolean:
        case ApplicationCommandOptionType.Integer:
          parsed[arg.name] = interaction.options.get(arg.name, arg.required)?.value || null;
          break;
        case ApplicationCommandOptionType.User:
          if (arg.type === ArgumentTypes.Member) {
            parsed[arg.name] =
              (interaction.options.get(arg.name, arg.required)?.member as ArgTypes) || null;
          } else {
            parsed[arg.name] =
              (interaction.options.get(arg.name, arg.required)?.user as ArgTypes) || null;
          }
          break;
        case ApplicationCommandOptionType.Role:
          parsed[arg.name] =
            (interaction.options.get(arg.name, arg.required)?.role as ArgTypes) || null;
          break;
        case ApplicationCommandOptionType.Channel:
          parsed[arg.name] =
            (interaction.options.get(arg.name, arg.required)?.channel as ArgTypes) || null;
          break;
        default:
          break;
      }
    });
    return parsed;
  }
}
