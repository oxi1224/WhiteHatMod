import { ActionMessage, ArgumentTypes, Command, Punishment, TimeInMs, colors, emotes } from "#lib";
import { msToTime, timeUnix } from "#util";
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ComponentEmojiResolvable,
  EmbedBuilder,
  PermissionFlagsBits,
  User,
  inlineCode,
  userMention
} from "discord.js";

export class Modlogs extends Command {
  constructor() {
    super("modlogs", {
      description: "Shows the punishment history of a user",
      aliases: ["modlogs", "punishments"],
      category: "moderation",
      usage: "modlogs <user>",
      examples: ["modlogs @oxi"],
      args: [
        {
          name: "user",
          type: ArgumentTypes.User,
          slashType: ApplicationCommandOptionType.User,
          required: true,
          description: "The user whose modlogs to display"
        }
      ],
      slash: true,
      userPerms: [PermissionFlagsBits.BanMembers]
    });
  }

  override async execute(
    msg: ActionMessage,
    args: {
      user: User;
    }
  ) {
    const entries = await Punishment.findAll({
      order: [["createdAt", "ASC"]],
      where: {
        guildID: msg.guild!.id,
        victimID: args.user.id
      }
    });

    if (entries.length == 0) {
      return msg.reply({
        embeds: [new EmbedBuilder().setColor(colors.info).setDescription("User has no modlogs")]
      });
    }

    const paginated: Punishment[][] = [];
    let page = 0;
    while (entries.length > 0) {
      paginated.push(entries.splice(0, 5));
    }

    const first = new ButtonBuilder()
      .setCustomId("modlogs-first")
      .setEmoji(emotes.first as ComponentEmojiResolvable)
      .setStyle(ButtonStyle.Primary);
    const back = new ButtonBuilder()
      .setCustomId("modlogs-back")
      .setEmoji(emotes.back as ComponentEmojiResolvable)
      .setStyle(ButtonStyle.Success);
    const stop = new ButtonBuilder()
      .setCustomId("modlogs-delete")
      .setEmoji(emotes.delete as ComponentEmojiResolvable)
      .setStyle(ButtonStyle.Danger);
    const next = new ButtonBuilder()
      .setCustomId("modlogs-next")
      .setEmoji(emotes.next as ComponentEmojiResolvable)
      .setStyle(ButtonStyle.Success);
    const last = new ButtonBuilder()
      .setCustomId("modlogs-last")
      .setEmoji(emotes.last as ComponentEmojiResolvable)
      .setStyle(ButtonStyle.Primary);

    const btns = new ActionRowBuilder<ButtonBuilder>().addComponents(first, back, stop, next, last);

    const reply = await msg.reply({
      embeds: [this.getPage(paginated, page)],
      components: [btns]
    });

    const collector = reply.createMessageComponentCollector({ time: TimeInMs.Second * 60 });
    collector.on("collect", async (i) => {
      if (!i.isButton()) return;
      /* eslint-disable indent */
      switch (i.customId) {
        case "modlogs-back":
          if (page === 0) break;
          else page--;
          break;
        case "modlogs-next":
          if (page === paginated.length - 1) break;
          else page++;
          break;
        case "modlogs-first":
          page = 0;
          break;
        case "modlogs-last":
          page = paginated.length - 1;
          break;
        case "modlogs-delete":
          reply.delete();
          collector.stop();
          break;
      }
      /* eslint-disable indent */
      await i.update({
        embeds: [this.getPage(paginated, page)],
        components: [btns]
      });
    });
    return;
  }

  private getPage(paginated: Punishment[][], page: number): EmbedBuilder {
    const builder = new EmbedBuilder().setColor(colors.base);
    for (const data of paginated[page]) {
      const addDuration = ["BAN", "MUTE", "TIMEOUT"].includes(data.type);
      let fieldValue = `Modlog ID: ${inlineCode(data.id.toString())}
Reason: ${inlineCode(data.reason || "N/A")}
Moderator: ${userMention(data.modID)}
`;
      if (addDuration) {
        if (data.duration) {
          fieldValue += `Duration: ${inlineCode(msToTime(data.duration - new Date(data.createdAt).getTime()))}\n`;
          fieldValue += `Expires: ${timeUnix(data.duration)}\n`;
        } else {
          fieldValue += `Duration: ${inlineCode("Permanent")}\n`;
          fieldValue += `Expires: ${inlineCode("Never")}\n`;
        }
      }
      fieldValue += `Added: ${timeUnix(data.createdAt.getTime())}`;
      builder.addFields({
        name: `Type: ${data.type}`,
        value: fieldValue
      });
    }
    builder.setFooter({
      text: `Page ${page + 1}/${paginated.length}`
    });
    return builder;
  }
}
