import { ApplicationCommandOptionType } from "discord-api-types/v10";
import { User, Role, NonThreadGuildBasedChannel, Snowflake, CommandInteractionOption, PermissionResolvable } from "discord.js";
import { DurationString } from "./constants.js";
import { EventEmitter } from 'events';

export interface ClassConstructor<constructable> {
  new (): constructable,
}

export interface CustomClientOptions {
  owners: Snowflake[],
}

export interface CommandHandlerOptions {
  commandExportFile: string,
  prefix: string,
  flagRegex?: RegExp,
  aliasReplacement?: RegExp,
}

export interface CommandOptions {
  aliases: string[],
  args: CommandArgument[],
  userPermissions?: PermissionResolvable,
  clientPermissions?: bigint[],
  description: string,
  usage: string,
  examples: string[],
  category: string,
  slash?: boolean,
  extraInfo?: string,
}

export interface CommandArgument {
  id: string,
  type: CommandArgumentType,
  required?: boolean,
  slashType?: ApplicationCommandOptionType,
  description?: string,
  length?: number,
  options?: InteractionChoice[]
}

export interface InteractionChoice {
  name: string
  value: string | number
}

export type CommandArgumentType = 'duration' | 'string' | 'user' | 'channel' | 'role' | 'boolean' | 'integer' | 'number' | 'flag'
export type Duration = `${number}${keyof typeof DurationString}`
export interface ParsedDuration {
  raw: string | null,
  timestamp: number | null;
}
export interface ParsedArgs { [key: string]: string | boolean | number | User | NonThreadGuildBasedChannel | Role | ParsedDuration | null | undefined | CommandInteractionOption }

export interface TaskHandlerOptions {
  taskExportFile: string,
  defaultInterval: number,
}

export interface TaskOptions {
  interval?: number,
}

export interface ListenerHandlerOptions {
  listenerExportFile: string,
}

export interface ListenerOptions {
  emitter: EventEmitter,
  event: string,
  method?: 'on' | 'once',
}