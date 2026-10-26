import { formatMonthParts } from "./format";

export const monthSwitchClass =
  "grid grid-cols-2 items-center gap-2 min-[376px]:grid-cols-[6.35rem_minmax(0,1fr)_6.35rem] min-[376px]:gap-1.5 md:flex md:justify-between md:gap-3";

export const monthSwitchButtonClass =
  "h-8 w-full shrink-0 whitespace-nowrap rounded-lg border border-line bg-card px-1.5 text-[11px] disabled:opacity-40 md:h-10 md:w-auto md:px-3 md:text-sm";

export const monthPrevButtonClass = `${monthSwitchButtonClass} min-[376px]:col-start-1 min-[376px]:row-start-1`;

export const monthNextButtonClass = `${monthSwitchButtonClass} min-[376px]:col-start-3 min-[376px]:row-start-1`;

export const monthTitleClass =
  "col-span-2 row-start-1 min-w-0 text-center min-[376px]:col-span-1 min-[376px]:col-start-2";

export function PreviousMonthLabel() {
  return (
    <>
      <span className="md:hidden">Pre. month</span>
      <span className="hidden md:inline">Previous month</span>
    </>
  );
}

export function MonthTitle({ month, compact = false }: { month: string; compact?: boolean }) {
  const parts = formatMonthParts(month);
  const size = compact ? "text-lg min-[376px]:text-[15px] md:text-2xl" : "text-lg min-[376px]:text-base md:text-3xl";
  return (
    <span className={`inline-flex max-w-full min-w-0 items-baseline justify-center gap-1 font-serif md:gap-2 ${size}`}>
      <span className="truncate rounded-lg bg-ink px-2 py-1 text-paper md:rounded-xl md:px-3 md:py-1">{parts.month}</span>
      <span className="shrink-0">{parts.year}</span>
    </span>
  );
}
