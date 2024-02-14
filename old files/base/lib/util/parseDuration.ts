import { DurationString, TimeInMs, type Duration } from "#base";

/**
 * Parses duration into a timestamp and adds currentTime to it.
 * @param duration - The duration to parse.
 * @param currentTime - The start time of this function.
 * @returns A timesamp duration away from currentTime
 */
export function parseDuration(duration: Duration, currentTime: number): number | null {
  if (!duration) return null;
  const matchResult = duration.match(/\d+/);
  if (!matchResult) return null;
  const timeNumber = matchResult[0];
  const timeString = duration.split("").slice(timeNumber.length, duration.length).join("").trim();
  return (
    parseInt(timeNumber) *
      TimeInMs[DurationString[timeString.toLowerCase() as keyof typeof DurationString]] +
    currentTime
  );
}
