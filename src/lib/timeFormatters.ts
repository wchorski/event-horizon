export const formatTimeMinutesToClockString = (mins: number, hour12?: boolean) => {
  const displayMin = mins % 1440; // wrap back to 0-1439
  const date = new Date(Date.UTC(2000, 0, 1, 0, displayMin));

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: hour12 ? true : false,
    timeZone: "UTC",
  });
};

export function formatTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}