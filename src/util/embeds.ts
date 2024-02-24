import { ModerationEventData, colors } from "#lib";
import { EmbedBuilder, EmbedField, inlineCode, userMention } from "discord.js";
import { timeUnix } from "./timeUnix.js";

export function modlogEmbed(
  logID: number,
  data: ModerationEventData
) {
  const embed = new EmbedBuilder()
    .setTimestamp()
    .setColor(colors.base)
    .setAuthor({
      name: `${data.moderator.user.displayName}`,
      iconURL: data.moderator.displayAvatarURL()
    })
    .setTitle(`Action: ${data.type}`);

  const fields: EmbedField[] = [
    { name: "Moderator", value: userMention(data.moderator.id), inline: true },
    { name: "Victim", value: userMention(data.victim.id), inline: true },
    { name: "Case ID", value: logID.toString(), inline: true },
    { name: "Reason", value: inlineCode(data.reason || "N/A"), inline: false }
  ];

  if (data.duration !== undefined)
    fields.push({
      name: "Expires",
      value: data.duration ? timeUnix(data.duration) : "Never",
      inline: false
    });
  embed.addFields(fields);
  return embed;
}
