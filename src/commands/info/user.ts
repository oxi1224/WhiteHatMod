import { ArgumentTypes, Command, colors } from "#lib";
import { ApplicationCommandOptionType } from "discord-api-types/v10";
import {
  CommandInteraction,
  EmbedBuilder,
  EmbedField,
  GuildMember,
  Message,
  User
} from "discord.js";
import humanizeDuration from "humanize-duration";

export class UserCommand extends Command {
  constructor() {
    super("user", {
      aliases: ["user", "u", "userinfo"],
      description: "Displays info about a user",
      usage: "u [user]",
      examples: ["u", "u @oxi#6219"],
      category: "info",
      args: [
        {
          name: "user",
          description: "The user to display info about",
          type: ArgumentTypes.User,
          slashType: ApplicationCommandOptionType.User,
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
    const user: User = args.user || (msg.member!.user as User);
    const member: GuildMember | null = args.user
      ? await msg.guild!.members.fetch(args.user)
      : (msg.member as GuildMember);
    const embed = new EmbedBuilder()
      .setDescription(`${user}`)
      .setFooter({ text: `ID: ${user.id}` })
      .setTimestamp()
      .setThumbnail(user.displayAvatarURL())
      .setColor(colors.base)
      .setAuthor({ name: `${user.globalName}`, iconURL: user.displayAvatarURL() });
    const fields: EmbedField[] = [
      {
        name: "Created at:",
        value: `<t:${Math.floor(user.createdTimestamp / 1000)}>\n(${humanizeDuration(user.createdTimestamp - new Date().getTime(), { largest: 3 })})`,
        inline: true
      }
    ];

    if (member) {
      if (!member.joinedTimestamp) return;
      fields.push(
        ...[
          {
            name: "Joined at:",
            value: `<t:${Math.floor(member.joinedTimestamp / 1000)}>\n(${humanizeDuration(member.joinedTimestamp - new Date().getTime(), { largest: 3 })})`,
            inline: true
          },
          {
            name: "Presence",
            value: `» **Status**: ${member.presence ? `${member.presence.status} \n${this.getActivities(member)}` : "offline"}`,
            inline: false
          },
          {
            name: `Roles[${member.roles.cache.size}]`,
            value:
              member.roles.cache.size !== 0
                ? `${member.roles.cache.toJSON().join(" ")}`
                : "User has no roles",
            inline: false
          }
        ]
      );
      embed.setColor(member.displayHexColor);
    }
    embed.setFields(fields);
    return msg.reply({ embeds: [embed] });
  }

  private getActivities(member: GuildMember) {
    if (!member || !member.presence) return;
    const dataToAdd: string[] = [];
    if (!member.presence.activities || member.presence.activities.length === 0) return "";
    member.presence.activities.forEach((activity) => {
      if (activity.name === "Custom Status")
        return dataToAdd.push(`» **Custom Status**: \`\`${activity.state}\`\``);
      return dataToAdd.push(`» **Activity**: \`\`${activity.name}\`\``);
    });
    return dataToAdd.join("\n");
  }
}
