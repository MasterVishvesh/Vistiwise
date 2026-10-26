export function localISODate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDayParts(isoDate: string): { weekday: string; day: string; month: string } {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return {
    weekday: date.toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" }),
    day: String(day),
    month: date.toLocaleDateString("en-GB", { month: "long", timeZone: "UTC" }),
  };
}

export function formatMonthParts(month: string): { month: string; year: string } {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1, 1));
  return {
    month: date.toLocaleDateString("en-GB", { month: "long", timeZone: "UTC" }),
    year: String(year),
  };
}

export function formatLongDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function formatMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function shiftMonth(month: string, delta: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function formatRupees(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function genderLabel(gender: "male" | "female" | "other"): string {
  if (gender === "male") return "M";
  if (gender === "female") return "F";
  return "Other";
}

export const WEEKDAYS = [
  { day: 1, label: "Mon" },
  { day: 2, label: "Tue" },
  { day: 3, label: "Wed" },
  { day: 4, label: "Thu" },
  { day: 5, label: "Fri" },
  { day: 6, label: "Sat" },
  { day: 0, label: "Sun" },
] as const;

export function formatDaysOff(daysOff: number[]): string {
  return WEEKDAYS.filter((weekday) => daysOff.includes(weekday.day))
    .map((weekday) => weekday.label)
    .join(", ");
}

function formatClock(value: string): string {
  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const suffix = hour >= 12 ? "pm" : "am";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minuteText} ${suffix}`;
}

export function formatTimeSlot(start: string, end?: string | null): string {
  if (!end) return formatClock(start);
  const startClock = formatClock(start);
  const endClock = formatClock(end);
  const startSuffix = startClock.slice(-2);
  const endSuffix = endClock.slice(-2);
  if (startSuffix === endSuffix) return `${startClock.slice(0, -3)} to ${endClock}`;
  return `${startClock} to ${endClock}`;
}
