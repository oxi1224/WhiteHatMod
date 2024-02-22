import { time } from "discord.js";

export function timeUnix(num: number) {
  return time(Math.floor(num / 1000));
}