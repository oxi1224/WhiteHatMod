import { Listener, colors } from "#lib";
import { client } from "#src/bot.js";
import { EmbedBuilder, Message, TextChannel, inlineCode, userMention } from "discord.js";

export class MessageUpdate extends Listener {
  constructor() {
    super("messageUpdate", {
      emitter: client,
      event: "messageUpdate"
    });
  }

  public override async execute(oldMsg: Message, newMsg: Message) {
    if (!newMsg.inGuild()) return;
    const cfg = await this.client.getGuildConfig(newMsg.guild.id);
    if (!cfg || !cfg.messageLogChannel) return;
    const logChannel = (await newMsg.guild.channels
      .fetch(cfg.messageLogChannel)
      .catch(() => null)) as TextChannel | null;
    if (!logChannel) return;
    const oldMsgContent: string[] = [];
    const newMsgContent: string[] = [];

    let addTo = 0;
    for (let content of [oldMsg.content, newMsg.content]) {
      if (content.length > 1000) {
        while (content.length > 0) {
          if (addTo == 0) oldMsgContent.push(content.substring(0, 999));
          else newMsgContent.push(content.substring(0, 999));
          content = content.substring(1000);
        }
      } else if (addTo == 0) {
        oldMsgContent.push(content);
      } else {
        newMsgContent.push(content);
      }
      addTo += 1;
    }

    logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(colors.error)
          .setTitle("Message updated")
          .setDescription(`Author: ${userMention(newMsg.author.id)}`)
          .setFields(
            ...oldMsgContent.map((v, i) => ({
              name: `Old contents [${i}]`,
              value: inlineCode(v),
              inline: false
            })),
            ...newMsgContent.map((v, i) => ({
              name: `New contents [${i}]`,
              value: inlineCode(v),
              inline: false
            }))
          )
      ]
    });
  }
}
