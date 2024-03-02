import { Listener, colors } from "#lib";
import { client } from "#src/bot.js";
import {
  EmbedBuilder,
  GuildMember,
  TextChannel,
  inlineCode,
  roleMention,
  userMention
} from "discord.js";

export class GuildMemberUpdate extends Listener {
  constructor() {
    super("guildMemberUpdate", {
      emitter: client,
      event: "guildMemberUpdate"
    });
  }

  public override async execute(oldUser: GuildMember, newUser: GuildMember) {
    const cfg = await this.client.getGuildConfig(newUser.guild.id);
    if (!cfg || !cfg.otherLogChannel) return;
    const logChannel = (await newUser.guild.channels
      .fetch(cfg.otherLogChannel)
      .catch(() => null)) as TextChannel | null;
    if (!logChannel) return;
    if (oldUser.nickname !== newUser.nickname) {
      logChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.base)
            .setTitle("Nick change")
            .setDescription(`User: ${userMention(newUser.id)}`)
            .addFields(
              { name: "Old", value: inlineCode(oldUser.nickname || "None"), inline: true },
              { name: "New", value: inlineCode(newUser.nickname || "None"), inline: true }
            )
        ]
      });
    } else {
      oldUser.roles.cache.forEach((role) => {
        if (newUser.roles.cache.has(role.id)) return;
        logChannel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(colors.base)
              .setTitle("Removed role")
              .setDescription(`From user: ${userMention(newUser.id)}`)
              .addFields({ name: "Role", value: roleMention(role.id) })
          ]
        });
      });

      newUser.roles.cache.forEach((role) => {
        if (oldUser.roles.cache.has(role.id)) return;
        logChannel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(colors.base)
              .setTitle("Added role")
              .setDescription(`To user: ${userMention(newUser.id)}`)
              .addFields({ name: "Role", value: roleMention(role.id) })
          ]
        });
      });
    }
  }
}
