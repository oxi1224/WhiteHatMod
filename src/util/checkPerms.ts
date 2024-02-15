import { GuildMember, PermissionsBitField } from "discord.js";

export function getMissingPermNames(user: GuildMember, perms: bigint[]): string[] {
  const missing: string[] = [];
  for (const perm of perms) {
    if (!user.permissions.has(perm)) {
      missing.push(getPermissionName(perm));
    }
  }
  return missing;
}

export function getPermissionName(permission: bigint): string {
  for (const perm of Object.keys(PermissionsBitField.Flags)) {
    if (PermissionsBitField.Flags[perm as keyof typeof PermissionsBitField.Flags] === permission) {
      return perm;
    }
  }
  return 'UnknownPermission';
}