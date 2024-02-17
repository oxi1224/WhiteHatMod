import { TimeConversion, TimeStrings } from "#lib";

export function parseDuration(str: string): number | null {
  str = str.replaceAll(" ", "");
  const split = str.split("");
  const suffix = split.filter((char) => isNaN(parseInt(char))).join("");
  const duration = TimeStrings[suffix.toLowerCase()];
  const amount = parseInt(split.filter((char) => !isNaN(parseInt(char))).join(""));
  if (!duration || !amount) return null;
  return new Date().getTime() + TimeConversion[duration] * amount;
}
