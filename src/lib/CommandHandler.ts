import { getMissingPermNames, parseDuration } from "#util";
import {
  ApplicationCommandOptionType,
  Client,
  Collection,
  CommandInteraction,
  Guild,
  GuildMember,
  Message,
  REST,
  Routes,
  SlashCommandBuilder,
  inlineCode
} from "discord.js";
import "dotenv/config";
import { Command } from "./Command.js";
import { ArgumentTypes, FlagTypes } from "./constants.js";
import { ArgTypes, Argument, ClassConstructor, ParsedArgs } from "./types.js";

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN ?? "");

export class CommandHandler {
  public prefix: string;
  public client: Client;

  private commands = new Collection<string, Command>();
  private commandExportPath: string;
  constructor(pref: string, _client: Client, commandPath: string) {
    this.prefix = pref;
    this.client = _client;
    this.commandExportPath = commandPath;
  }

  public async load() {
    const slashBuilders: SlashCommandBuilder[] = [];
    const imported: { [key: string]: ClassConstructor<Command> } = await import(
      this.commandExportPath
    );
    for (const constructor of Object.values(imported)) {
      const cmd = new constructor();
      if (this.commands.has(cmd.id)) {
        throw new Error("Commands cannot have the same ID");
      }

      this.commands.set(cmd.id, cmd);
      if (cmd.slash) slashBuilders.push(this.initSlash(cmd));
    }

    await rest
      .put(Routes.applicationCommands(process.env.CLIENT_ID ?? ""), {
        body: slashBuilders.map((b) => b.toJSON())
      })
      .catch((e) => console.error(e));
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

      if (userPerms.length > 0) {
        return msg.reply(
          "You are missing the following permissions: " + inlineCode(userPerms.join(", "))
        );
      }
      if (botPerms.length > 0) {
        return msg.reply(
          "The bot is missing the following permissions: " + inlineCode(botPerms.join(", "))
        );
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

      if (userPerms.length > 0) {
        return interaction.reply({
          content: "You are missing the following permissions: " + inlineCode(userPerms.join(", ")),
          ephemeral: true
        });
      }
      if (botPerms.length > 0) {
        return interaction.reply(
          "The bot is missing the following permissions: " + inlineCode(botPerms.join(", "))
        );
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

    const flagIdx = contents.indexOf("--") > 0 ? contents.indexOf("--") : contents.length;
    for (const arg of args) {
      const spaceIdx = contents.indexOf(" ") > 0 ? contents.indexOf(" ") : contents.length;
      let setValue: ArgTypes = null;
      let tempVal: string;

      switch (arg.type) {
        case ArgumentTypes.User:
          tempVal = contents.substring(0, spaceIdx).replace(/[\\<>@]/g, "");
          setValue = guild.client.users.resolve(tempVal);
          if (setValue) contents = contents.substring(spaceIdx + 1);
          break;
        case ArgumentTypes.Member:
          tempVal = contents.substring(0, spaceIdx).replace(/[\\<>@]/g, "");
          setValue = guild.members.resolve(tempVal);
          if (setValue) contents = contents.substring(spaceIdx + 1);
          break;
        case ArgumentTypes.Channel:
          tempVal = contents.substring(0, spaceIdx).replace(/[\\<>#]/g, "");
          setValue = guild.channels.resolve(tempVal);
          if (setValue) contents = contents.substring(spaceIdx + 1);
          break;
        case ArgumentTypes.Role:
          tempVal = contents.substring(0, spaceIdx).replace(/[\\<>@&]/g, "");
          setValue = guild.roles.resolve(tempVal);
          if (setValue) contents = contents.substring(spaceIdx + 1);
          break;
        case ArgumentTypes.Text:
          setValue = contents.substring(0, flagIdx).trim();
          if (setValue) contents = contents.substring(flagIdx);
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
          // starts at 2 because of -- prefix
          tempVal = contents.substring(2, spaceIdx);
          if (arg.flagType === FlagTypes.Int) {
            setValue = parseInt(tempVal);
          } else if (arg.flagType === FlagTypes.Number) {
            setValue = parseFloat(tempVal);
          } else if (arg.flagType === FlagTypes.String) {
            setValue = tempVal;
          } else if (arg.flagType === FlagTypes.Bool) {
            setValue = tempVal === "true";
          }
          if (setValue || setValue === false) contents = contents.substring(spaceIdx + 1);
          break;
        default:
          break;
      }
      parsed[arg.name] = setValue;
    }
    return parsed;
  }

  private parseInteractionArgs(
    interaction: CommandInteraction,
    args: Argument[]
  ): ParsedArgs {
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
          parsed[arg.name] =
            interaction.options.get(arg.name, arg.required)?.member as ArgTypes ||
            interaction.options.get(arg.name, arg.required)?.user as ArgTypes ||
            null;
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
