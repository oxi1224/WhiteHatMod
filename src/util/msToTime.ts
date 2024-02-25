export function msToTime(ms: number): string {
  const seconds = parseInt((ms / 1000).toFixed(1));
  const minutes = parseInt((ms / (1000 * 60)).toFixed(1));
  const hours = parseInt((ms / (1000 * 60 * 60)).toFixed(1));
  const days = parseInt((ms / (1000 * 60 * 60 * 24)).toFixed(1));
  if (seconds < 60) return seconds + "s";
  else if (minutes < 60) return minutes + "min";
  else if (hours < 24) return hours + "h";
  else return days + "d";
}
