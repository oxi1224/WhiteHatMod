import { getMissingPermNames } from "#util";
import {
  ApplicationCommandOptionType,
  Client,
  Collection,
  CommandInteraction,
  GuildMember,
  Message,
  REST,
  Routes,
  SlashCommandBuilder,
  inlineCode
} from "discord.js";
import "dotenv/config";
import { Command } from "./Command.js";
import { ClassConstructor } from "./types.js";

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
              .addChoices(...arg.choices)
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
              .addChoices(...arg.choices)
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

    const spaceI = msg.content.indexOf(" ") > 0 ? msg.content.indexOf(" ") : 0;
    const command = msg.content.substring(1, spaceI || msg.content.length);
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
      commandObject.execute(msg);
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
      cmd.execute(interaction);
    }
    return;
  }
}
