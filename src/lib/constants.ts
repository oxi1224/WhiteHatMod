import { ColorResolvable, Colors, EmojiResolvable, Snowflake } from "discord.js";

export const enum ArgumentTypes {
  User,
  Member,
  Channel,
  Role,
  Text,
  Int,
  Number,
  Bool,
  Duration,
  Flag
}

export const enum FlagTypes {
  Int,
  Number,
  Bool,
  String
}

export enum TimeInMs {
  Milisecond = 1,
  Second = Milisecond * 1000,
  Minute = Second * 60,
  Hour = Minute * 60,
  Day = Hour * 24,
  Week = Day * 7,
  Month = Day * 31,
  Year = Day * 365
}

export const TimeStrings: { [key: string]: keyof typeof TimeInMs } = Object.freeze({
  s: "Second",
  sec: "Second",
  second: "Second",
  seconds: "Second",
  m: "Minute",
  min: "Minute",
  minute: "Minute",
  minutes: "Minute",
  h: "Hour",
  hr: "Hour",
  hrs: "Hour",
  hour: "Hour",
  hours: "Hour",
  d: "Day",
  day: "Day",
  days: "Day",
  w: "Week",
  week: "Week",
  weeks: "Week",
  mo: "Month",
  month: "Month",
  months: "Month",
  y: "Year",
  yr: "Year",
  year: "Year",
  years: "Year"
});

export const colors: { [key: string]: ColorResolvable } = Object.freeze({
  base: "#0099ff",
  error: "#ef4047",
  success: "#3fa45d",
  info: "#cb8715",
  ...Colors
});

export const emotes: { [key: string]: EmojiResolvable } = Object.freeze({
  success: "<:success:980866382323396723>",
  error: "<:error:980866363461599292>",
  info: "<:info:980866381283201025>"
});

export const staticIDs: { [key: string]: Snowflake } = Object.freeze({
  "mainGuild": "508779434929815554",
  "mainGuildDev": "613024666079985702",
  "errorChannel": "981918816739131443",
  "errorChannelDev": "980478015412772884"
});