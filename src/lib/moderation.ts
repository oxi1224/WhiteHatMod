import { timeUnix } from "#util";
import {
  EmbedBuilder,
  GuildMember,
  GuildMemberResolvable,
  GuildResolvable,
  PermissionFlagsBits,
  Role,
  User,
  UserResolvable,
  bold,
  inlineCode,
  italic,
  userMention
} from "discord.js";
import { TimeInMs, colors, emotes } from "./constants.js";
import { PunishmentType } from "./models/Punishment.js";
import { Client } from "./structs/Client.js";

export interface ModerationCommandOptions {
  victim: UserResolvable | GuildMemberResolvable;
  mod: GuildMemberResolvable;
  reason?: string;
  duration?: number;
  banDeleteDays?: number;
}

export type ResponseType = "error" | "success" | "info";

export interface CommandResponse {
  type: ResponseType;
  message: string;
}

export interface ModerationEventData {
  type: PunishmentType;
  victim: User | GuildMember;
  moderator: GuildMember;
  reason?: string;
  duration?: number;
}

export function resEmbed(res: CommandResponse) {
  return new EmbedBuilder()
    .setColor(colors[res.type])
    .setDescription(`${emotes[res.type]} ${italic(bold(res.message))}`);
}

function dmEmbed(
  guildName: string,
  action: string,
  reason: string,
  duration: number | null | string
) {
  let description = `Reason: ${inlineCode(reason)}`;
  if (duration !== null)
    description +=
      typeof duration == "string"
        ? `\nDuration: ${inlineCode(duration)}`
        : `\nUntil: ${timeUnix(duration)}`;
  return new EmbedBuilder()
    .setColor(colors.base)
    .setTitle(`You've been ${action} in ${guildName}`)
    .setDescription(description);
}

export async function ban(
  client: Client,
  guildResolve: GuildResolvable,
  options: ModerationCommandOptions
): Promise<CommandResponse> {
  const guild = await client.guilds.fetch({ guild: guildResolve });
  let victim: User | GuildMember | null = await guild.members
    .fetch(options.victim)
    .catch(() => null);
  if (!victim) victim = await client.users.fetch(options.victim);
  const mod = await guild.members.fetch(options.mod);

  if (victim instanceof GuildMember && victim.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return {
      type: "error",
      message: `${userMention(victim.id)} is a staff member`
    };
  }
  const bans = await guild.bans.fetch();
  if (bans.has(victim.id)) {
    return {
      type: "info",
      message: `${userMention(victim.id)} is already banned`
    };
  }
  if (!mod.permissions.has(PermissionFlagsBits.BanMembers)) {
    return {
      type: "error",
      message: `You are missing ${inlineCode("BanMembers")} permissions`
    };
  }
  // prettier-ignore
  await victim.send({
    embeds: [dmEmbed(guild.name, "banned", options.reason || "N/A", options.duration || "Permanent")]
  }).catch(() => null);
  try {
    guild.members.ban(victim, {
      reason: options.reason || "N/A",
      deleteMessageSeconds: (options.banDeleteDays || 0) * (TimeInMs.Day / 1000)
    });
    client.emit("punishmentAdd", guild, {
      type: "BAN",
      victim: victim,
      moderator: mod,
      reason: options.reason,
      duration: options.duration
    });
    return {
      type: "success",
      message: `Successfully banned ${userMention(victim.id)}`
    };
  } catch (e) {
    return {
      type: "error",
      message: "An error occured during the banning process"
    };
  }
}

export async function unban(
  client: Client,
  guildResolve: GuildResolvable,
  options: ModerationCommandOptions
): Promise<CommandResponse> {
  const guild = await client.guilds.fetch({ guild: guildResolve });
  let victim: User | GuildMember | null = await guild.members
    .fetch(options.victim)
    .catch(() => null);
  if (!victim) victim = await client.users.fetch(options.victim);
  const mod = await guild.members.fetch(options.mod);
  const bans = await guild.bans.fetch();
  if (!bans.has(victim.id)) {
    return {
      type: "info",
      message: `${userMention(victim.id)} is not banned`
    };
  }
  if (!mod.permissions.has(PermissionFlagsBits.BanMembers)) {
    return {
      type: "error",
      message: `You are missing ${inlineCode("BanMembers")} permissions`
    };
  }
  // prettier-ignore
  await victim.send({
    embeds: [dmEmbed(guild.name, "unbanned", options.reason || "N/A", null)]
  }).catch(() => null);
  try {
    guild.members.unban(victim);
    client.emit("punishmentAdd", guild, {
      type: "UNBAN",
      victim: victim,
      moderator: mod,
      reason: options.reason
    });
    return {
      type: "success",
      message: `Successfully unbanned ${userMention(victim.id)}`
    };
  } catch (e) {
    return {
      type: "error",
      message: "An error occured during the unbanning process"
    };
  }
}

export async function kick(
  client: Client,
  guildResolve: GuildResolvable,
  options: ModerationCommandOptions
): Promise<CommandResponse> {
  const guild = await client.guilds.fetch({ guild: guildResolve });
  const victim: GuildMember | null = await guild.members.fetch(options.victim).catch(() => null);
  if (!victim) {
    return {
      type: "info",
      message: "User is not in guild"
    };
  }
  if (victim.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return {
      type: "error",
      message: `${userMention(victim.id)} is a staff member`
    };
  }
  const mod = await guild.members.fetch(options.mod);
  if (!mod.permissions.has(PermissionFlagsBits.KickMembers)) {
    return {
      type: "error",
      message: `You are missing ${inlineCode("KickMembers")} permissions`
    };
  }
  // prettier-ignore
  await victim.send({
    embeds: [dmEmbed(guild.name, "kicked", options.reason || "N/A", null)]
  }).catch(() => null);
  try {
    guild.members.kick(victim, options.reason || "N/A");
    client.emit("punishmentAdd", guild, {
      type: "KICK",
      victim: victim,
      moderator: mod,
      reason: options.reason
    });
    return {
      type: "success",
      message: `Successfully kicked ${userMention(victim.id)}`
    };
  } catch (e) {
    return {
      type: "error",
      message: "An error occured during the kicking process"
    };
  }
}

export async function mute(
  client: Client,
  guildResolve: GuildResolvable,
  options: ModerationCommandOptions
): Promise<CommandResponse> {
  const guild = await client.guilds.fetch({ guild: guildResolve });
  const victim: GuildMember | null = await guild.members.fetch(options.victim).catch(() => null);
  let mutedRole: Role | null = null;
  const cfg = await client.getGuildConfig(guild);
  if (cfg && cfg.mutedRole) {
    mutedRole = await guild.roles.fetch(cfg.mutedRole);
  }
  if (!mutedRole) {
    const roles = await guild.roles.fetch();
    mutedRole = roles.find((v) => v.name === "mute" || v.name === "muted") || null;
  }
  if (!mutedRole) {
    return {
      type: "error",
      message: "Failed to find the muted role"
    };
  }
  if (!victim) {
    return {
      type: "info",
      message: "User is not in guild"
    };
  }
  if (victim.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return {
      type: "error",
      message: `${userMention(victim.id)} is a staff member`
    };
  }
  const mod = await guild.members.fetch(options.mod);
  if (!mod.permissions.has(PermissionFlagsBits.MuteMembers)) {
    return {
      type: "error",
      message: `You are missing ${inlineCode("MuteMembers")} permissions`
    };
  }
  // prettier-ignore
  await victim.send({
    embeds: [dmEmbed(guild.name, "muted", options.reason || "N/A", options.duration || "Permanent")]
  }).catch(() => null);
  try {
    victim.roles.add(mutedRole);
    client.emit("punishmentAdd", guild, {
      type: "MUTE",
      victim: victim,
      moderator: mod,
      reason: options.reason,
      duration: options.duration
    });
    return {
      type: "success",
      message: `Successfully muted ${userMention(victim.id)}`
    };
  } catch (e) {
    return {
      type: "error",
      message: "An error occured during the muting process"
    };
  }
}

export async function unmute(
  client: Client,
  guildResolve: GuildResolvable,
  options: ModerationCommandOptions
): Promise<CommandResponse> {
  const guild = await client.guilds.fetch({ guild: guildResolve });
  const victim: GuildMember | null = await guild.members.fetch(options.victim).catch(() => null);
  let mutedRole: Role | null = null;
  const cfg = await client.getGuildConfig(guild);
  if (cfg && cfg.mutedRole) {
    mutedRole = await guild.roles.fetch(cfg.mutedRole);
  }
  if (!mutedRole) {
    const roles = await guild.roles.fetch();
    mutedRole = roles.find((v) => v.name === "mute" || v.name === "muted") || null;
  }
  if (!mutedRole) {
    return {
      type: "error",
      message: "Failed to find the muted role"
    };
  }
  if (!victim) {
    return {
      type: "info",
      message: "User is not in guild"
    };
  }
  const mod = await guild.members.fetch(options.mod);
  if (!mod.permissions.has(PermissionFlagsBits.MuteMembers)) {
    return {
      type: "error",
      message: `You are missing ${inlineCode("MuteMembers")} permissions`
    };
  }
  // prettier-ignore
  await victim.send({
    embeds: [dmEmbed(guild.name, "unmuted", options.reason || "N/A", null)]
  }).catch(() => null);
  try {
    victim.roles.remove(mutedRole);
    client.emit("punishmentAdd", guild, {
      type: "UNMUTE",
      victim: victim,
      moderator: mod,
      reason: options.reason
    });
    return {
      type: "success",
      message: `Successfully unmuted ${userMention(victim.id)}`
    };
  } catch (e) {
    return {
      type: "error",
      message: "An error occured during the unmuting process"
    };
  }
}

export async function timeout(
  client: Client,
  guildResolve: GuildResolvable,
  options: ModerationCommandOptions
): Promise<CommandResponse> {
  const guild = await client.guilds.fetch({ guild: guildResolve });
  const victim: GuildMember | null = await guild.members.fetch(options.victim);
  if (!victim) {
    return {
      type: "info",
      message: "User is not in guild"
    };
  }
  const mod = await guild.members.fetch(options.mod);
  if (!mod.permissions.has(PermissionFlagsBits.MuteMembers)) {
    return {
      type: "error",
      message: `You are missing ${inlineCode("MuteMembers")} permissions`
    };
  }
  if (!options.duration || new Date().getTime() + TimeInMs.Week <= (options?.duration || 0)) {
    return {
      type: "error",
      message: "Invalid timeout duration. (min: 60s, max: 1 week)"
    };
  }
  // prettier-ignore
  await victim.send({
    embeds: [dmEmbed(guild.name, "ban", options.reason || "N/A", options.duration)]
  }).catch(() => null);
  try {
    victim.timeout(options.duration - new Date().getTime(), options.reason || "N/A");
    client.emit("punishmentAdd", guild, {
      type: "TIMEOUT",
      victim: victim,
      moderator: mod,
      reason: options.reason,
      duration: options.duration
    });
    return {
      type: "success",
      message: `Successfully timed out ${userMention(victim.id)}`
    };
  } catch (e) {
    return {
      type: "error",
      message: "An error occured during the timeout process"
    };
  }
}

export async function untimeout(
  client: Client,
  guildResolve: GuildResolvable,
  options: ModerationCommandOptions
): Promise<CommandResponse> {
  const guild = await client.guilds.fetch({ guild: guildResolve });
  const victim: GuildMember | null = await guild.members.fetch(options.victim).catch(() => null);
  if (!victim) {
    return {
      type: "info",
      message: "User is not in guild"
    };
  }
  const mod = await guild.members.fetch(options.mod);
  if (!mod.permissions.has(PermissionFlagsBits.MuteMembers)) {
    return {
      type: "error",
      message: `You are missing ${inlineCode("MuteMembers")} permissions`
    };
  }
  // prettier-ignore
  await victim.send({
    embeds: [dmEmbed(guild.name, "untimeout", options.reason || "N/A", null)]
  }).catch(() => null);
  try {
    victim.timeout(null, options.reason || "N/A");
    client.emit("punishmentAdd", guild, {
      type: "UNTIMEOUT",
      victim: victim,
      moderator: mod,
      reason: options.reason
    });
    return {
      type: "success",
      message: `Successfully removed time out for ${userMention(victim.id)}`
    };
  } catch (e) {
    return {
      type: "error",
      message: "An error occured during the untimeout process"
    };
  }
}

export async function warn(
  client: Client,
  guildResolve: GuildResolvable,
  options: ModerationCommandOptions
): Promise<CommandResponse> {
  const guild = await client.guilds.fetch({ guild: guildResolve });
  let victim: User | GuildMember | null = await guild.members
    .fetch(options.victim)
    .catch(() => null);
  if (!victim) victim = await client.users.fetch(options.victim);
  const mod = await guild.members.fetch(options.mod);
  if (!mod.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return {
      type: "error",
      message: `You are missing ${inlineCode("ManageMessages")} permissions`
    };
  }
  if (!options.reason) {
    return {
      type: "info",
      message: "Warn must have a reason"
    };
  }
  // prettier-ignore
  await victim.send({
    embeds: [dmEmbed(guild.name, "warned", options.reason || "N/A", null)]
  }).catch(() => null);
  client.emit("punishmentAdd", guild, {
    type: "WARN",
    victim: victim,
    moderator: mod,
    reason: options.reason
  });
  return {
    type: "success",
    message: `Successfully warned ${userMention(victim.id)}`
  };
}
