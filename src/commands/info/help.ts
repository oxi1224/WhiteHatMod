import { ActionMessage, ArgumentTypes, Command, FlagTypes, colors } from "#lib";
import { getPermissionName } from "#util";
import {
  ApplicationCommandOptionType,
  EmbedBuilder,
  EmbedField,
  inlineCode,
  italic
} from "discord.js";

export class Help extends Command {
  constructor() {
    super("help", {
      description: "Displays help information about a command",
      aliases: ["help"],
      category: "info",
      usage: "help <command>",
      examples: ["kick @oxi spamming"],
      args: [
        {
          name: "command",
          description: "The command to get information about",
          required: false,
          type: ArgumentTypes.Text,
          slashType: ApplicationCommandOptionType.String
        }
      ],
      slash: true
    });
  }

  override execute(
    msg: ActionMessage,
    args: {
      command?: string;
    }
  ) {
    const cmdData = this.client.commandHandler.commands.find((cmd) =>
      cmd.aliases.includes(args.command || "")
    );
    if (!cmdData) {
      const embedFields: { [key: string]: string[] } = {};
      for (const cmd of this.client.commandHandler.commands.values()) {
        if (!embedFields[cmd.category]) embedFields[cmd.category] = [];
        embedFields[cmd.category].push(inlineCode(cmd.id));
      }
      msg.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.base)
            .setFields(
              Object.entries(embedFields).map(([k, v]) => ({ name: k, value: v.join(", ") }))
            )
        ]
      });
    } else {
      const split = cmdData.id.split("");
      split[0] = split[0].toUpperCase();
      const builder = new EmbedBuilder()
        .setColor(colors.base)
        .setTimestamp()
        .setTitle(split.join(""))
        .setDescription(
          cmdData.description + (cmdData.slash ? italic("\nWorks with slash commands!") : "")
        )
        .addFields([
          {
            name: "Required Perms",
            value: cmdData.userPerms.map((p) => inlineCode(getPermissionName(p))).join(", ")
          },
          { name: "Aliases", value: cmdData.aliases.map((a) => inlineCode(a)).join(", ") },
          { name: "Usage", value: inlineCode(cmdData.usage) },
          { name: "Examples", value: cmdData.examples.map((ex) => inlineCode(ex)).join("\n") }
        ]);
      const argFields: EmbedField[] = [];
      for (const arg of cmdData.arguments) {
        let text = arg.description + "\n";
        text += `Required: ${inlineCode(arg.required.toString())}\n`;
        text += `Type: ${inlineCode(ArgumentTypes[arg.type])}`;
        if (arg.type === ArgumentTypes.Flag)
          text += `\nFlag Type: ${inlineCode(FlagTypes[arg.flagType!])}`;
        if (arg.choices)
          text += `\nChoices: ${arg.choices.map((c) => inlineCode(c.value.toString())).join(", ")}`;
        argFields.push({ name: arg.name, value: text, inline: false });
      }
      builder.addFields(argFields);
      msg.reply({
        embeds: [builder]
      });
    }
  }
}
