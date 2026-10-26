import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../api";
import { MonthTitle, PreviousMonthLabel, monthNextButtonClass, monthPrevButtonClass, monthSwitchClass, monthTitleClass } from "../MonthTitle";
import { localISODate, shiftMonth } from "../format";

type CalendarDay = {
  date: string;
  tone: "worked" | "leave" | "upcoming" | "empty";
  doneCount: number;
};

const toneClass = {
  worked: "bg-pine text-paper",
  leave: "bg-clay text-paper",
  upcoming: "border border-line bg-card text-ink",
  empty: "text-muted",
};

export function MonthPage() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(localISODate().slice(0, 7));
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [lead, setLead] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ days: CalendarDay[]; lead: number }>(`/calendar?month=${month}`)
      .then((response) => {
        setDays(response.days);
        setLead(response.lead);
        setError("");
      })
      .catch((caught) => {
        setError(caught instanceof ApiError ? caught.message : "Could not load the month.");
      });
  }, [month]);

  return (
    <main className="mx-auto max-w-3xl px-5 py-2 md:py-8">
      <div className={monthSwitchClass}>
        <button className={monthPrevButtonClass} onClick={() => setMonth(shiftMonth(month, -1))}>
          <PreviousMonthLabel />
        </button>
        <h1 className={monthTitleClass}>
          <MonthTitle month={month} />
        </h1>
        <button className={monthNextButtonClass} onClick={() => setMonth(shiftMonth(month, 1))}>
          Next month
        </button>
      </div>
      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
      <div className="mt-6 grid grid-cols-7 gap-1 text-center text-xs text-muted min-[376px]:gap-2">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((name) => (
          <div key={name}>{name}</div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1 min-[376px]:gap-2">
        {Array.from({ length: lead }, (_, index) => (
          <div key={`lead-${index}`} />
        ))}
        {days.map((day) => (
          <button
            key={day.date}
            className={`flex h-10 flex-col items-center justify-center rounded-lg text-xs min-[376px]:h-12 min-[376px]:rounded-xl min-[376px]:text-sm ${toneClass[day.tone]}`}
            onClick={() => navigate(`/?date=${day.date}`)}
          >
            <span>{Number(day.date.slice(-2))}</span>
            {day.doneCount > 0 ? <span className="text-[10px]">{day.doneCount}</span> : null}
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted">
        Green is a worked day. Brown is leave. A bordered day still has an open visit. Tap a date to mark it.
      </p>
    </main>
  );
}
