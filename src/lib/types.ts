import {
  APIApplicationCommandOptionChoice,
  ApplicationCommandOptionType,
  Channel,
  GuildMember,
  Role,
  User
} from "discord.js";
import { ArgumentTypes, FlagTypes, colors } from "./constants.js";

export interface ClassConstructor<T> {
  new (): T;
}

export type ArgTypes =
  | User
  | GuildMember
  | Channel
  | Role
  | string
  | number
  | string
  | boolean
  | null;

export interface ParsedArgs {
  [key: string]: ArgTypes;
}

export interface Argument {
  name: string;
  description: string;
  required: boolean;
  type: ArgumentTypes;
  slashType?: ApplicationCommandOptionType;
  choices?: APIApplicationCommandOptionChoice<number | string>[];
  flagType?: FlagTypes;
}

export type ColorType = keyof typeof colors;
