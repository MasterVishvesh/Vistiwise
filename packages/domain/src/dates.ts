export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function weekdaySunday(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function weekdayIndexMonday(isoDate: string): number {
  return (weekdaySunday(isoDate) + 6) % 7;
}

export function monthDates(month: string): string[] {
  const [year, monthNumber] = month.split("-").map(Number);
  const count = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const dates: string[] = [];
  for (let day = 1; day <= count; day += 1) {
    dates.push(
      `${year}-${String(monthNumber).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    );
  }
  return dates;
}

export function inMonth(isoDate: string, month: string): boolean {
  return isoDate.startsWith(`${month}-`) || isoDate.startsWith(month);
}
