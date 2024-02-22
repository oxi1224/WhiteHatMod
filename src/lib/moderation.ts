import { timeUnix } from "#util";
import {
  GuildMember,
  GuildMemberResolvable,
  GuildResolvable,
  PermissionFlagsBits,
  User,
  UserResolvable,
  inlineCode,
  userMention
} from "discord.js";
import { TimeInMs } from "./constants.js";
import { Client } from "./structs/Client.js";

export interface CommandOptions {
  victim: UserResolvable | GuildMemberResolvable;
  mod: GuildMemberResolvable;
  reason?: string;
  duration?: number;
  banDeleteDays?: number;
}

export async function ban(client: Client, guildResolve: GuildResolvable, options: CommandOptions) {
  const guild = await client.guilds.fetch({ guild: guildResolve });
  let victim: User | GuildMember | null = await guild.members
    .fetch(options.victim)
    .catch(() => null);
  if (!victim) victim = await client.users.fetch(options.victim);
  const mod = await guild.members.fetch(options.mod);

  if (victim instanceof GuildMember && victim.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return `${userMention(victim.id)} is a staff member`;
  }
  const bans = await guild.bans.fetch();
  if (bans.has(victim.id)) {
    return `${userMention(victim.id)} is already banned`;
  }
  if (!mod.permissions.has(PermissionFlagsBits.BanMembers)) {
    return `You are missing ${inlineCode("BanMembers")} permissions`;
  }
  const msg = `You've been ${options.duration ? "" : "permanently "}banned in ${guild.name}${options.duration ? ` until ${timeUnix(options.duration)}` : ""}\nReason: ${inlineCode(options.reason || "N/A")}`;
  await victim.send(msg).catch(() => null);
  try {
    guild.members.ban(victim, {
      reason: options.reason || "N/A",
      deleteMessageSeconds: (options.banDeleteDays || 0) * (TimeInMs.Day / 1000)
    });
    client.emit("ban", guild, {
      victim: victim,
      moderator: mod,
      reason: options.reason,
      duration: options.duration
    });
    return `Successfully banned ${userMention(victim.id)}`;
  } catch (e) {
    return "An error occured during the banning process";
  }
}

export async function unban(
  client: Client,
  guildResolve: GuildResolvable,
  options: CommandOptions
) {
  const guild = await client.guilds.fetch({ guild: guildResolve });
  let victim: User | GuildMember | null = await guild.members
    .fetch(options.victim)
    .catch(() => null);
  if (!victim) victim = await client.users.fetch(options.victim);
  const mod = await guild.members.fetch(options.mod);
  const bans = await guild.bans.fetch();
  if (!bans.has(victim.id)) {
    return `${userMention(victim.id)} is not banned`;
  }
  if (!mod.permissions.has(PermissionFlagsBits.BanMembers)) {
    return `You are missing ${inlineCode("BanMembers")} permissions`;
  }
  const msg = `You've been unbanned in ${guild.name}\nReason: ${inlineCode(options.reason || "N/A")}`;
  await victim.send(msg).catch(() => null);
  try {
    guild.members.unban(victim);
    client.emit("unban", guild, {
      victim: victim,
      moderator: mod,
      reason: options.reason
    });
    return `Successfully unbanned ${userMention(victim.id)}`;
  } catch (e) {
    return "An error occured during the unbanning process";
  }
}

export async function kick(client: Client, guildResolve: GuildResolvable, options: CommandOptions) {
  const guild = await client.guilds.fetch({ guild: guildResolve });
  const victim: GuildMember | null = await guild.members.fetch(options.victim).catch(() => null);
  if (!victim) {
    return "User is not in guild";
  }
  if (victim.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return `${userMention(victim.id)} is a staff member`;
  }
  const mod = await guild.members.fetch(options.mod);
  if (!mod.permissions.has(PermissionFlagsBits.KickMembers)) {
    return `You are missing ${inlineCode("KickMembers")} permissions`;
  }
  const msg = `You've been kicked from ${guild.name}\nReason: ${inlineCode(options.reason || "N/A")}`;
  await victim.send(msg).catch(() => null);
  try {
    guild.members.kick(victim, options.reason || "N/A");
    client.emit("kick", guild, {
      victim: victim,
      moderator: mod,
      reason: options.reason
    });
    return `Successfully kicked ${userMention(victim.id)}`;
  } catch (e) {
    return "An error occured during the kicking process";
  }
}

export async function mute(client: Client, guildResolve: GuildResolvable, options: CommandOptions) {
  const guild = await client.guilds.fetch({ guild: guildResolve });
  const victim: GuildMember | null = await guild.members.fetch(options.victim).catch(() => null);
  const roles = await guild.roles.fetch();
  // TODO implement in guild config
  const mutedRole = roles.find((v) => v.name === "mute" || v.name === "muted");
  if (!mutedRole) {
    return "Failed to find the muted role";
  }
  if (!victim) {
    return "User is not in guild";
  }
  if (victim.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return `${userMention(victim.id)} is a staff member`;
  }
  const mod = await guild.members.fetch(options.mod);
  if (!mod.permissions.has(PermissionFlagsBits.MuteMembers)) {
    return `You are missing ${inlineCode("MuteMembers")} permissions`;
  }
  const msg = `You've been ${options.duration ? "" : "permanently "}muted in ${guild.name}${options.duration ? ` until ${timeUnix(options.duration)}` : ""}\nReason: ${inlineCode(options.reason || "N/A")}`;
  await victim.send(msg).catch(() => null);
  try {
    victim.roles.add(mutedRole);
    client.emit("mute", guild, {
      victim: victim,
      moderator: mod,
      reason: options.reason,
      duration: options.duration
    });
    return `Successfully muted ${userMention(victim.id)}`;
  } catch (e) {
    return "An error occured during the muting process";
  }
}

export async function unmute(
  client: Client,
  guildResolve: GuildResolvable,
  options: CommandOptions
) {
  const guild = await client.guilds.fetch({ guild: guildResolve });
  const victim: GuildMember | null = await guild.members.fetch(options.victim).catch(() => null);
  const roles = await guild.roles.fetch();
  // TODO implement in guild config
  const mutedRole = roles.find((v) => v.name === "mute" || v.name === "muted");
  if (!mutedRole) {
    return "Failed to find the muted role";
  }
  if (!victim) {
    return "User is not in guild";
  }
  const mod = await guild.members.fetch(options.mod);
  if (!mod.permissions.has(PermissionFlagsBits.MuteMembers)) {
    return `You are missing ${inlineCode("MuteMembers")} permissions`;
  }
  const msg = `You've been unmuted in ${guild.name}\nReason: ${inlineCode(options.reason || "N/A")}`;
  await victim.send(msg).catch(() => null);
  try {
    victim.roles.remove(mutedRole);
    client.emit("unmute", guild, {
      victim: victim,
      moderator: mod,
      reason: options.reason
    });
    return `Successfully unmuted ${userMention(victim.id)}`;
  } catch (e) {
    return "An error occured during the unmuting process";
  }
}

export async function timeout(
  client: Client,
  guildResolve: GuildResolvable,
  options: CommandOptions
) {
  const guild = await client.guilds.fetch({ guild: guildResolve });
  const victim: GuildMember | null = await guild.members.fetch(options.victim).catch(() => null);
  if (!victim) {
    return "User is not in guild";
  }
  const mod = await guild.members.fetch(options.mod);
  if (!mod.permissions.has(PermissionFlagsBits.MuteMembers)) {
    return `You are missing ${inlineCode("MuteMembers")} permissions`;
  }
  if (!options.duration || new Date().getTime() + TimeInMs.Week <= (options?.duration || 0)) {
    return "Invalid timeout duration. (min: 60s, max: 1 week)";
  }
  const msg = `You've been timed out in ${guild.name}${options.duration ? ` until ${timeUnix(options.duration)}` : ""}\nReason: ${inlineCode(options.reason || "N/A")}`;
  await victim.send(msg).catch(() => null);
  try {
    victim.timeout(options.duration, options.reason || "N/A");
    client.emit("timeout", guild, {
      victim: victim,
      moderator: mod,
      reason: options.reason,
      duration: options.duration
    });
    return `Successfully timed out ${userMention(victim.id)}`;
  } catch (e) {
    return "An error occured during the timeout process";
  }
}

export async function untimeout(
  client: Client,
  guildResolve: GuildResolvable,
  options: CommandOptions
) {
  const guild = await client.guilds.fetch({ guild: guildResolve });
  const victim: GuildMember | null = await guild.members.fetch(options.victim).catch(() => null);
  if (!victim) {
    return "User is not in guild";
  }
  const mod = await guild.members.fetch(options.mod);
  if (!mod.permissions.has(PermissionFlagsBits.MuteMembers)) {
    return `You are missing ${inlineCode("MuteMembers")} permissions`;
  }
  const msg = `You've been un timed out in ${guild.name}\nReason: ${inlineCode(options.reason || "N/A")}`;
  await victim.send(msg).catch(() => null);
  try {
    victim.timeout(null, options.reason || "N/A");
    client.emit("untimeout", guild, {
      victim: victim,
      moderator: mod,
      reason: options.reason
    });
    return `Successfully removed timed out for ${userMention(victim.id)}`;
  } catch (e) {
    return "An error occured during the untimeout process";
  }
}

export async function warn(client: Client, guildResolve: GuildResolvable, options: CommandOptions) {
  const guild = await client.guilds.fetch({ guild: guildResolve });
  let victim: User | GuildMember | null = await guild.members
    .fetch(options.victim)
    .catch(() => null);
  if (!victim) victim = await client.users.fetch(options.victim);
  const mod = await guild.members.fetch(options.mod);
  if (!mod.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return `You are missing ${inlineCode("ManageMessages")} permissions`;
  }
  if (!options.reason) {
    return "Warn must have a reason";
  }
  const msg = `You've been warned in ${guild.name}\nReason: ${inlineCode(options.reason)}`;
  await victim.send(msg).catch(() => null);
  // warn is taken
  client.emit("userWarn", {
    victim: victim,
    moderator: mod,
    reason: options.reason
  });
  return `Successfully warned ${userMention(victim.id)}`;
}
