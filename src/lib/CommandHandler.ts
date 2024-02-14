import {
  ApplicationCommandOptionType,
  Client,
  Collection,
  CommandInteraction,
  Message,
  REST,
  Routes,
  SlashCommandBuilder
} from "discord.js";
import "dotenv/config";
import { Command } from "./Command.js";

interface ClassConstructor<T> {
  new (): T;
}

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

  public handleMessage(msg: Message) {
    if (msg.author.id == process.env.CLIENT_ID) return;
    if (!msg.content.startsWith(this.prefix)) return;
    const spaceI = msg.content.indexOf(" ") > 0 ? msg.content.indexOf(" ") : 0;
    const command = msg.content.substring(1, spaceI || msg.content.length);
    const commandObject = this.commands.find(entry => entry.aliases.includes(command));
    if (commandObject) {
      commandObject.execute(msg);
    }
  }

  public handleInteraction(interaction: CommandInteraction) {
    if (this.commands.has(interaction.commandName)) {
      this.commands.get(interaction.commandName)!.execute(interaction);
    }
  }
}
