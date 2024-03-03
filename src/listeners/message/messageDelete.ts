import { Listener, colors } from "#lib";
import { client } from "#src/bot.js";
import { EmbedBuilder, Message, TextChannel, inlineCode, userMention } from "discord.js";
import "dotenv/config";

export class MessageDelete extends Listener {
  constructor() {
    super("messageDelete", {
      emitter: client,
      event: "messageDelete"
    });
  }

  public override async execute(msg: Message) {
    if (!msg.inGuild()) return;
    if (msg.author.id === process.env.CLIENT_ID) return;
    const cfg = await this.client.getGuildConfig(msg.guild.id);
    if (!cfg || !cfg.messageLogChannel) return;
    const logChannel = (await msg.guild.channels
      .fetch(cfg.messageLogChannel)
      .catch(() => null)) as TextChannel | null;
    if (!logChannel) return;
    const contents: string[] = [];
    if (msg.content.length > 1000) {
      let content = msg.content;
      while (content.length > 0) {
        contents.push(content.substring(0, 999));
        content = content.substring(1000);
      }
    } else {
      contents.push(msg.content);
    }
    logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(colors.error)
          .setTitle("Message deleted")
          .setDescription(`Author: ${userMention(msg.author.id)}`)
          .addFields(contents.map((v, i) => ({ name: `Contents [${i}]`, value: inlineCode(v) })))
      ]
    });
  }
}
