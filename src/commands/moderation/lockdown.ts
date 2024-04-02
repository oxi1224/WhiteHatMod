import { ActionMessage, ArgumentTypes, Command, colors, emotes } from "#lib";
import {
  ApplicationCommandOptionType,
  EmbedBuilder,
  GuildChannel,
  PermissionFlagsBits,
  TextChannel,
  User,
  channelMention,
  inlineCode,
  userMention
} from "discord.js";

export class Lockdown extends Command {
  constructor() {
    super("lockdown", {
      description:
        "Locks the specified channel or all channels found in config as lockdownChannels",
      aliases: ["lockdown"],
      category: "moderation",
      usage: "lockdown [channel] [reason]",
      examples: ["lockdown #general raid", "lockdown raid"],
      args: [
        {
          name: "channel",
          type: ArgumentTypes.Channel,
          slashType: ApplicationCommandOptionType.Channel,
          required: false,
          description: "The channel to lockdown"
        },
        {
          name: "reason",
          type: ArgumentTypes.Text,
          slashType: ApplicationCommandOptionType.String,
          required: false,
          description: "The reason of the lockdown"
        }
      ],
      botPerms: [PermissionFlagsBits.ManageChannels],
      userPerms: [PermissionFlagsBits.ManageChannels],
      slash: true
    });
  }

  override async execute(
    msg: ActionMessage,
    args: {
      channel?: GuildChannel;
      reason?: string;
    }
  ) {
    const cfg = await this.client.getGuildConfig(msg.guild!.id);
    const everyoneRole = (await msg.guild!.roles.fetch()).find((r) => r.name === "@everyone")!;

    const lockdownEmbed = new EmbedBuilder()
      .setColor(colors.info)
      .setTitle(`${emotes.info} This channel has been locked`)
      .setDescription(`Reason: ${inlineCode(args.reason || "N/A")}`)
      .setTimestamp();

    if (args.channel) {
      try {
        await args.channel.edit({
          permissionOverwrites: [
            {
              id: everyoneRole.id,
              deny: PermissionFlagsBits.SendMessages
            }
          ]
        });
        (args.channel as TextChannel).send({ embeds: [lockdownEmbed] });
      } catch {
        return msg.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(colors.error)
              .setDescription(`Failed to lockdown ${channelMention(args.channel.id)}`)
          ]
        });
      }
      return msg.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(colors.success)
            .setDescription(`Successfully locked ${channelMention(args.channel.id)}`)
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

    const locked: string[] = [];
    const failedToFind: string[] = [];
    const failedToLockdown: string[] = [];
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
              deny: PermissionFlagsBits.SendMessages
            }
          ]
        });
        channel.send({ embeds: [lockdownEmbed] });
        locked.push(channelID);
      } catch {
        failedToLockdown.push(channelID);
      }
    }

    const resEmbed = new EmbedBuilder()
      .setColor(
        failedToFind.length > 0 || failedToLockdown.length > 0 ? colors.info : colors.success
      )
      .setTitle("Lockdown result");

    if (locked.length > 0)
      resEmbed.addFields({
        name: "Locked Channels",
        value: locked.map((id) => channelMention(id)).join(", ")
      });
    if (failedToFind.length > 0)
      resEmbed.addFields({
        name: "Failed to find",
        value: failedToFind.map((id) => inlineCode(id)).join(", ")
      });
    if (failedToLockdown.length > 0)
      resEmbed.addFields({
        name: "Failed to lockdown",
        value: failedToLockdown.map((id) => channelMention(id)).join(", ")
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
          .setTitle("Action: LOCKDOWN")
          .setAuthor({
            name: `${(msg.member!.user as User).displayName}`,
            iconURL: (msg.member!.user as User).displayAvatarURL()
          })
          .setFields([
            { name: "Moderator", value: userMention(msg.member!.user.id), inline: true },
            {
              name: "Affected Channels",
              value: locked.map((id) => channelMention(id)).join(", "),
              inline: true
            },
            { name: "Reason", value: inlineCode(args.reason || "N/A"), inline: false }
          ])
      ]
    });
  }
}
