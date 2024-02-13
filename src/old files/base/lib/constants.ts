import { SlashCommandBuilder } from 'discord.js';
import { Argument } from '../command/Argument.js';

export enum TimeInMs {
  Milisecond = 1,
  Second = Milisecond * 1000,
  Minute = Second * 60,
  Hour = Minute * 60,
  Day = Hour * 24,
  Week = Day * 7,
  Month = Day * 31
}

export enum DurationString {
  min = 'Minute',
  minute = 'Minute',
  minutes = 'Minute',
  h = 'Hour',
  hour = 'Hour',
  hours = 'Hour',
  d = 'Day',
  day = 'Day',
  days = 'Day',
  w = 'Week',
  week = 'Week',
  weeks = 'Week',
  m = 'Month',
  month = 'Month',
  months = 'Month'
}

export const regex = {
  user: /(<@\d{6,18}>|\d{6,20})/,
  channel: /(<#\d{6,18}>|\d{6,20})/,
  role: /(<@!\d{6,18}>|\d{6,20})/,
  snowflake: /<[\\@#&!]+\d{6,20}>/,
  duration: /^\d+(min|minute|minutes|h|hour|hours|d|day|days|w|week|weeks|m|month|months)$/i,
};

export const slashOptions = {
  '3': (slashCommand: SlashCommandBuilder, arg: Argument) => slashCommand.addStringOption((option) => {
    option.setName(arg.id)
      .setDescription(arg.description ?? '')
      .setRequired(arg.required);
    if (arg.options) option.addChoices(...(arg.options as { name: string, value: string }[]));
    return option;
  }),
  '4': (slashCommand: SlashCommandBuilder, arg: Argument) => slashCommand.addIntegerOption(option => {
    option.setName(arg.id)
      .setDescription(arg.description ?? '')
      .setRequired(arg.required);
    if (arg.options) option.addChoices(...(arg.options as { name: string, value: number }[]));
    return option;
  }),
  '5': (slashCommand: SlashCommandBuilder, arg: Argument) => slashCommand.addBooleanOption(option => option.setName(arg.id)
    .setDescription(arg.description ?? '')
    .setRequired(arg.required)
  ),
  '6': (slashCommand: SlashCommandBuilder, arg: Argument) => slashCommand.addUserOption(option => option.setName(arg.id)
    .setDescription(arg.description ?? '')
    .setRequired(arg.required)
  ),
  '7': (slashCommand: SlashCommandBuilder, arg: Argument) => slashCommand.addChannelOption(option => option.setName(arg.id)
    .setDescription(arg.description ?? '')
    .setRequired(arg.required)
  ),
  '8': (slashCommand: SlashCommandBuilder, arg: Argument) => slashCommand.addRoleOption(option => option.setName(arg.id)
    .setDescription(arg.description ?? '')
    .setRequired(arg.required)
  ),
  '10': (slashCommand: SlashCommandBuilder, arg: Argument) => slashCommand.addNumberOption(option => option.setName(arg.id)
    .setDescription(arg.description ?? '')
    .setRequired(arg.required)
  ),
};