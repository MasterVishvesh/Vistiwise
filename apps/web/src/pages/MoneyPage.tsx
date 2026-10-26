import { useEffect, useState } from "react";
import { api, ApiError } from "../api";
import { MonthTitle, PreviousMonthLabel, monthNextButtonClass, monthPrevButtonClass, monthSwitchClass, monthTitleClass } from "../MonthTitle";
import { formatMonth, formatRupees, localISODate, shiftMonth } from "../format";

type Earnings = {
  month: string;
  total: number;
  lines: { patientId: string; name: string; amount: number; note: string }[];
  carried: { patientId: string; name: string; amount: number; countedIn: string; doneCount: number }[];
};

export function MoneyPage() {
  const [month, setMonth] = useState(localISODate().slice(0, 7));
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Earnings>(`/earnings?month=${month}`)
      .then((response) => {
        setEarnings(response);
        setError("");
      })
      .catch((caught) => {
        setError(caught instanceof ApiError ? caught.message : "Could not load earnings.");
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
      <p className="mt-6 font-serif text-4xl min-[376px]:text-5xl">{formatRupees(earnings?.total ?? 0)}</p>
      <p className="mt-2 text-sm text-muted">
        Done per-visit fees in this month. A package is counted once, in the month the course starts. Leave adds nothing.
      </p>
      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-card">
        {earnings?.lines.map((line) => (
          <div key={line.patientId} className="flex items-start justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0">
            <span className="min-w-0">
              {line.name}
              <span className="mt-1 block text-sm text-muted">{line.note}</span>
            </span>
            <span className="shrink-0">{formatRupees(line.amount)}</span>
          </div>
        ))}
        {(earnings?.carried ?? []).map((line) => (
          <div key={line.patientId} className="border-b border-line px-4 py-3 last:border-b-0">
            <p>{line.name}</p>
            <p className="mt-1 text-sm text-muted">
              {line.doneCount === 1 ? "1 visit" : `${line.doneCount} visits`} this month. The{" "}
              {formatRupees(line.amount)} package is counted in {formatMonth(line.countedIn)}.
            </p>
          </div>
        ))}
        {earnings && earnings.lines.length === 0 && (earnings.carried?.length ?? 0) === 0 ? (
          <p className="px-4 py-6 text-muted">Nothing earned in this month yet.</p>
        ) : null}
      </div>
    </main>
  );
}
