import { ArgumentTypes, Command, colors } from "#lib";
import { ApplicationCommandOptionType } from "discord-api-types/v10";
import { CommandInteraction, EmbedBuilder, Message, User } from "discord.js";

export class Avatar extends Command {
  constructor() {
    super("avatar", {
      aliases: ["avatar", "av"],
      description: "Displays a user's avatar",
      usage: "av [user]",
      examples: ["av", "av @oxi#6219"],
      category: "info",
      args: [
        {
          name: "user",
          type: ArgumentTypes.User,
          slashType: ApplicationCommandOptionType.User,
          description: "The user whose avatar to display",
          required: false
        }
      ],
      slash: true
    });
  }

  public override async execute(
    msg: Message | CommandInteraction,
    args: {
      user?: User;
    }
  ) {
    const user = args.user || (msg.member!.user as User);
    const embed = new EmbedBuilder()
      .setFooter({ text: `ID: ${user.id}` })
      .setTimestamp()
      .setColor(colors.base)
      .setTitle(`${user.globalName}'s Avatar`)
      .setImage(user.displayAvatarURL({ size: 4096 }));
    return msg.reply({ embeds: [embed] });
  }
}
