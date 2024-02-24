import { Listener, ModerationEventData } from "#lib";
import { client } from "#src/bot.js";
import { timeUnix } from "#util";
import { Guild, TextChannel, userMention } from "discord.js";

// 
export class BanListener extends Listener {
  constructor() {
    super("banListener", {
      emitter: client,
      event: "ban"
    });
  }

  override async execute(guild: Guild, data: ModerationEventData) {
    const logChannel = await guild.channels.fetch("977566053062303764") as TextChannel;
    logChannel.send(`Action: Ban
Until: ${data.duration ? timeUnix(data.duration) : "Permanent"}
Reason: ${data.reason || "N/A"}
Moderator: ${userMention(data.moderator.id)}
Victim: ${userMention(data.victim.id)}
`);
  }
}