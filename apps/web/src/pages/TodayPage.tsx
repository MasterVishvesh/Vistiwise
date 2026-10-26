import { addDays } from "@physio/domain";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, ApiError, type DayPatient, type DayResponse } from "../api";
import { formatDayParts, formatTimeSlot, genderLabel, localISODate } from "../format";

const statusLabel = {
  planned: "Not done",
  done: "Done",
  doctor_leave: "Doctor leave",
  patient_leave: "Patient leave",
  holiday: "Government holiday",
} as const;

export function TodayPage() {
  const [params, setParams] = useSearchParams();
  const date = params.get("date") ?? localISODate();
  const [day, setDay] = useState<DayResponse | null>(null);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState("");

  async function load() {
    setError("");
    try {
      setDay(await api<DayResponse>(`/days/${date}`));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not load the day.");
    }
  }

  useEffect(() => {
    void load();
  }, [date]);

  async function save(items: { patientId: string; result: DayPatient["status"] }[]) {
    if (items.length === 0) return;
    setPendingId("all");
    setError("");
    try {
      await api(`/days/${date}/results`, {
        method: "POST",
        body: JSON.stringify({
          items: items.map((item) => ({
            patientId: item.patientId,
            result: item.result === "planned" ? undefined : item.result,
            clear: item.result === "planned",
          })),
        }),
      });
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not save the day.");
    } finally {
      setPendingId("");
    }
  }

  const rows = day?.groups.flatMap((group) => group.patients) ?? [];
  const open = rows.filter((patient) => patient.status === "planned");
  const shown = formatDayParts(date);
  const today = localISODate();

  async function setHoliday(enabled: boolean) {
    setPendingId("holiday");
    setError("");
    try {
      await api(`/days/${date}/holiday`, {
        method: "POST",
        body: JSON.stringify({ enabled }),
      });
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not save the holiday.");
    } finally {
      setPendingId("");
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-2 md:py-8">
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-pine">{shown.weekday}</p>
          {date !== today ? (
            <button className="text-xs text-pine md:text-sm" onClick={() => setParams({})}>
              Jump to today
            </button>
          ) : null}
        </div>
        <div className="mt-1 flex flex-col gap-2 min-[376px]:flex-row min-[376px]:items-center min-[376px]:justify-between">
          <p className="flex items-center gap-2">
            <span className="inline-flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg bg-ink px-1.5 font-serif text-xl text-paper md:h-11 md:min-w-11 md:rounded-xl md:px-2 md:text-2xl">
              {shown.day}
            </span>
            <span className="font-serif text-2xl min-[376px]:truncate md:text-3xl">{shown.month}</span>
          </p>
          <div className="grid grid-cols-2 gap-1.5 min-[376px]:flex min-[376px]:shrink-0">
            <button
              className="h-8 whitespace-nowrap rounded-lg border border-line bg-card px-2 text-xs md:h-9 md:px-3 md:text-sm"
              onClick={() => setParams({ date: addDays(date, -1) })}
            >
              <span className="min-[376px]:hidden">Pre. day</span>
              <span className="hidden min-[376px]:inline">Previous day</span>
            </button>
            <button
              className="h-8 whitespace-nowrap rounded-lg border border-line bg-card px-2 text-xs md:h-9 md:px-3 md:text-sm"
              onClick={() => setParams({ date: addDays(date, 1) })}
            >
              Next day
            </button>
          </div>
        </div>
        <h1 className="mt-2 font-serif text-3xl md:text-4xl">{day ? `${day.openCount} still open` : "Today"}</h1>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          className="h-11 rounded-xl bg-ink px-4 text-paper disabled:opacity-50"
          disabled={pendingId !== "" || open.length === 0}
          onClick={() => save(open.map((patient) => ({ patientId: patient.id, result: "done" })))}
        >
          Mark all done
        </button>
        <button
          className="h-11 rounded-xl border border-line bg-card px-4 disabled:opacity-50"
          disabled={pendingId !== "" || open.length === 0}
          onClick={() =>
            save(open.map((patient) => ({ patientId: patient.id, result: "doctor_leave" })))
          }
        >
          Doctor leave for everyone
        </button>
        <button
          className={`h-11 rounded-xl px-4 disabled:opacity-50 ${
            day?.holiday ? "bg-clay text-paper" : "border border-line bg-card"
          }`}
          disabled={pendingId !== ""}
          onClick={() => void setHoliday(!day?.holiday)}
        >
          {day?.holiday ? "Remove holiday" : "Government holiday"}
        </button>
      </div>
      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
      <div className="mt-6 flex flex-col gap-6">
        {day?.groups.map((group) => (
          <section key={group.place}>
            <h2 className="text-xs uppercase tracking-[0.14em] text-muted">{group.place}</h2>
            <div className="mt-2 overflow-hidden rounded-2xl border border-line bg-card">
              {group.patients.map((patient) => (
                <article key={patient.id} className="border-b border-line px-4 py-3 last:border-b-0">
                  <div className="flex flex-col items-start gap-2 min-[376px]:flex-row min-[376px]:justify-between">
                    <div>
                      <p className="font-medium">
                        {formatTimeSlot(patient.timeSlot, patient.timeEnd)} {patient.name}, {patient.age}{" "}
                        {genderLabel(patient.gender)}
                      </p>
                      <p className="text-sm text-muted">
                        {patient.condition}
                        {patient.landmark ? ` · ${patient.landmark}` : ""}
                      </p>
                    </div>
                    <span className={`${badgeClass(patient.status)} whitespace-nowrap`}>{statusLabel[patient.status]}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(
                      [
                        ["done", "Done"],
                        ["doctor_leave", "Doctor leave"],
                        ["patient_leave", "Patient leave"],
                        ["planned", "Clear"],
                      ] as const
                    ).map(([result, label]) => (
                      <button
                        key={result}
                        className="h-9 rounded-lg border border-line px-3 text-sm disabled:opacity-40 max-[375px]:px-2 max-[375px]:text-xs"
                        disabled={
                          pendingId !== "" ||
                          patient.status === result ||
                          (patient.status === "holiday" && result === "planned")
                        }
                        onClick={() => save([{ patientId: patient.id, result }])}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
        {day && rows.length === 0 ? (
          <p className="text-muted">No course falls on this date.</p>
        ) : null}
      </div>
    </main>
  );
}

function badgeClass(status: DayPatient["status"]): string {
  if (status === "done") return "rounded-full bg-pine-soft px-2 py-1 text-xs text-pine";
  if (status === "planned") return "rounded-full bg-paper px-2 py-1 text-xs text-muted";
  return "rounded-full bg-clay-soft px-2 py-1 text-xs text-clay";
}
