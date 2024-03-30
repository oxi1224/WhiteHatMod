import { ArgumentTypes, Command, colors, emotes } from "#lib";
import {
  ApplicationCommandOptionType,
  CommandInteraction,
  EmbedBuilder,
  GuildChannel,
  Message,
  PermissionFlagsBits,
  TextChannel,
  User,
  channelMention,
  inlineCode,
  userMention
} from "discord.js";

export class Unlockdown extends Command {
  constructor() {
    super("unlockdown", {
      description:
        "unlocks the specified channel or all channels found in config as lockdownChannels",
      aliases: ["unlockdown", "unlock"],
      category: "moderation",
      usage: "unlock [channel] [reason]",
      examples: ["unlock #general raid over", "unlockdown raid over"],
      args: [
        {
          name: "channel",
          type: ArgumentTypes.Channel,
          slashType: ApplicationCommandOptionType.Channel,
          required: false,
          description: "The channel to unlock"
        },
        {
          name: "reason",
          type: ArgumentTypes.Text,
          slashType: ApplicationCommandOptionType.String,
          required: false,
          description: "The reason of the unlock"
        }
      ],
      botPerms: [PermissionFlagsBits.ManageChannels],
      userPerms: [PermissionFlagsBits.ManageChannels],
      slash: true
    });
  }

  override async execute(
    msg: Message | CommandInteraction,
    args: {
      channel?: GuildChannel;
      reason?: string;
    }
  ) {
    const cfg = await this.client.getGuildConfig(msg.guild!.id);
    const everyoneRole = (await msg.guild!.roles.fetch()).find((r) => r.name === "@everyone")!;

    const unlockEmbed = new EmbedBuilder()
      .setColor(colors.success)
      .setTitle(`${emotes.success} This channel has been unlocked`)
      .setDescription(`Reason: ${inlineCode(args.reason || "N/A")}`)
      .setTimestamp();

    if (args.channel) {
      try {
        await args.channel.edit({
          permissionOverwrites: [
            {
              id: everyoneRole.id,
              allow: PermissionFlagsBits.SendMessages
            }
          ]
        });
        (args.channel as TextChannel).send({ embeds: [unlockEmbed] });
      } catch {
        return msg.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(colors.error)
              .setDescription(`Failed to unlock ${channelMention(args.channel.id)}`)
          ]
        });
      }
      return msg.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.success)
            .setDescription(`Successfully unlocked ${channelMention(args.channel.id)}`)
        ]
      });
    }
    if (cfg.lockdownChannels.length < 0)
      return msg.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.error)
            .setDescription("There are no lockdownChannels in the guild config")
        ]
      });

    const unlocked: string[] = [];
    const failedToFind: string[] = [];
    const failedToUnlock: string[] = [];
    for (const channelID of cfg.lockdownChannels) {
      const channel = (await msg.guild!.channels.fetch(channelID)) as TextChannel | null;
      if (!channel) {
        failedToFind.push(channelID);
        continue;
      }

      try {
        await channel.edit({
          permissionOverwrites: [
            {
              id: everyoneRole.id,
              allow: PermissionFlagsBits.SendMessages
            }
          ]
        });
        channel.send({ embeds: [unlockEmbed] });
        unlocked.push(channelID);
      } catch {
        failedToUnlock.push(channelID);
      }
    }

    const resEmbed = new EmbedBuilder()
      .setColor(failedToFind.length > 0 || failedToUnlock.length > 0 ? colors.info : colors.success)
      .setTitle("Unlock result");

    if (unlocked.length > 0)
      resEmbed.addFields({
        name: "Unlocked Channels",
        value: unlocked.map((id) => channelMention(id)).join(", ")
      });
    if (failedToFind.length > 0)
      resEmbed.addFields({
        name: "Failed to find",
        value: failedToFind.map((id) => inlineCode(id)).join(", ")
      });
    if (failedToUnlock.length > 0)
      resEmbed.addFields({
        name: "Failed to unlock",
        value: failedToUnlock.map((id) => channelMention(id)).join(", ")
      });
    msg.reply({ embeds: [resEmbed] });

    if (!cfg.moderationLogChannel) return;
    const logChannel = (await msg.guild!.channels.fetch(cfg.moderationLogChannel)) as TextChannel;
    if (!logChannel) return;
    return logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(colors.base)
          .setTimestamp()
          .setTitle("Action: UNLOCKDOWN")
          .setAuthor({
            name: `${(msg.member!.user as User).displayName}`,
            iconURL: (msg.member!.user as User).displayAvatarURL()
          })
          .setFields([
            { name: "Moderator", value: userMention(msg.member!.user.id), inline: true },
            {
              name: "Affected Channels",
              value: unlocked.map((id) => channelMention(id)).join(", "),
              inline: true
            },
            { name: "Reason", value: inlineCode(args.reason || "N/A"), inline: false }
          ])
      ]
    });
  }
}
