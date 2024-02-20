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
