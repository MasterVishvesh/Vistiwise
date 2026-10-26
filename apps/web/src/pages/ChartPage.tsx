import { monthDates, weekdayIndexMonday } from "@physio/domain";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, ApiError, type ChartBox, type PatientDetail } from "../api";
import { MonthTitle, PreviousMonthLabel, monthNextButtonClass, monthPrevButtonClass, monthSwitchClass, monthTitleClass } from "../MonthTitle";
import { formatDaysOff, formatLongDate, formatRupees, formatTimeSlot, genderLabel, localISODate, shiftMonth } from "../format";
import { PatientForm, type PatientDraft } from "./PatientForm";

export function ChartPage() {
  const { id = "" } = useParams();
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState(false);

  function load() {
    api<PatientDetail>(`/patients/${id}`)
      .then(setPatient)
      .catch((caught) => {
        setError(caught instanceof ApiError ? caught.message : "Could not load the chart.");
      });
  }

  useEffect(() => {
    load();
  }, [id]);

  async function extend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    setError("");
    try {
      await api(`/patients/${id}/extend`, {
        method: "POST",
        body: JSON.stringify({
          extraDays: Number(data.get("extraDays")),
          extraAmount: Number(data.get("extraAmount") ?? 0),
          createdOn: localISODate(),
        }),
      });
      form.reset();
      load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not extend the course.");
    } finally {
      setPending(false);
    }
  }

  async function saveDetails(draft: PatientDraft) {
    setPending(true);
    setError("");
    try {
      await api(`/patients/${id}`, {
        method: "PATCH",
        body: JSON.stringify(draft),
      });
      setEditing(false);
      load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not save the patient.");
    } finally {
      setPending(false);
    }
  }

  async function closeCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const closedOn = String(new FormData(form).get("closedOn") ?? "");
    setPending(true);
    setError("");
    try {
      await api(`/patients/${id}/close`, {
        method: "POST",
        body: JSON.stringify({ closedOn }),
      });
      load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not close the patient.");
    } finally {
      setPending(false);
    }
  }

  async function reopen() {
    setPending(true);
    setError("");
    try {
      await api(`/patients/${id}/reopen`, { method: "POST" });
      load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not reopen the patient.");
    } finally {
      setPending(false);
    }
  }

  if (!patient) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-8">
        <BackToPatients />
        <p className="mt-4 text-muted">{error || "Loading the chart…"}</p>
      </main>
    );
  }

  const place =
    patient.placeType === "home"
      ? patient.landmark || patient.address || "Home"
      : patient.placeName;
  const leaveCount = patient.boxes.filter((box) => box.kind === "leave").length;

  return (
    <main className="mx-auto max-w-3xl px-5 py-2 md:py-8">
      <BackToPatients />
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{patient.publicCode}</p>
        <button
          className="h-10 rounded-lg border border-line bg-card px-3 text-sm"
          onClick={() => {
            setError("");
            setEditing((current) => !current);
          }}
        >
          {editing ? "Close edit" : "Edit details"}
        </button>
      </div>
      <h1 className="font-serif text-3xl min-[376px]:text-4xl">{patient.name}</h1>
      <p className="mt-3 text-sm text-muted">
        {patient.age} {genderLabel(patient.gender)} · {patient.condition} · {place} ·{" "}
        {formatTimeSlot(patient.timeSlot, patient.timeEnd)}
        {patient.daysOff.length > 0 ? ` · off ${formatDaysOff(patient.daysOff)}` : ""} ·{" "}
        {formatRupees(patient.feeAmount)} {patient.feeType === "per_visit" ? "a visit" : "package"}
      </p>
      {editing ? (
        <PatientForm
          values={{
            name: patient.name,
            age: String(patient.age),
            gender: patient.gender,
            condition: patient.condition,
            placeType: patient.placeType,
            placeName: patient.placeType === "home" ? "" : patient.placeName,
            address: patient.address ?? "",
            landmark: patient.landmark ?? "",
            startDate: patient.startDate,
            treatmentDays: String(patient.treatmentDays),
            timeSlot: patient.timeSlot,
            timeEnd: patient.timeEnd,
            daysOff: patient.daysOff,
            feeType: patient.feeType,
            feeAmount: String(patient.feeAmount),
          }}
          submitLabel="Save details"
          pending={pending}
          error={error}
          onCancel={() => {
            setEditing(false);
            setError("");
          }}
          onSubmit={saveDetails}
        />
      ) : null}
      <CourseCalendar
        key={patient.publicCode}
        boxes={patient.boxes}
        doneCount={patient.doneCount}
        leaveCount={leaveCount}
        closedOn={patient.closedOn}
      />
      {patient.closedOn ? (
        <div className="mt-8">
          <p className="text-sm text-muted">
            This course is closed. It no longer appears on later days. Visits already marked stay on the chart.
          </p>
          <button
            className="mt-3 h-11 rounded-xl border border-line bg-card px-4 disabled:opacity-60"
            disabled={pending}
            onClick={() => void reopen()}
          >
            Reopen
          </button>
        </div>
      ) : (
        <form className="mt-8 flex flex-wrap items-end gap-3" onSubmit={closeCourse}>
          <p className="w-full text-sm text-muted">
            If this patient stops treatment, close the course. Days after this date leave Today and the calendar.
          </p>
          <label className="text-sm">
            <span className="text-muted">Close date</span>
            <input
              name="closedOn"
              type="date"
              required
              defaultValue={localISODate()}
              className="mt-1 block h-11 rounded-xl border border-line bg-card px-3"
            />
          </label>
          <button className="h-11 rounded-xl border border-line bg-card px-4 disabled:opacity-60" disabled={pending}>
            Close patient
          </button>
        </form>
      )}
      {patient.closedOn ? null : (
      <form className="mt-8 flex flex-wrap items-end gap-3" onSubmit={extend}>
        <label className="text-sm">
          <span className="text-muted">Extra days</span>
          <input name="extraDays" type="number" min={1} defaultValue={3} required className="mt-1 block h-11 w-28 rounded-xl border border-line bg-card px-3" />
        </label>
        {patient.feeType === "package" ? (
          <label className="text-sm">
            <span className="text-muted">Extra package amount</span>
            <input name="extraAmount" type="number" min={0} defaultValue={0} className="mt-1 block h-11 w-40 rounded-xl border border-line bg-card px-3" />
          </label>
        ) : null}
        <button className="h-11 rounded-xl bg-ink px-4 text-paper disabled:opacity-60" disabled={pending}>
          Extend
        </button>
      </form>
      )}
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </main>
  );
}

function CourseCalendar({
  boxes,
  doneCount,
  leaveCount,
  closedOn,
}: {
  boxes: ChartBox[];
  doneCount: number;
  leaveCount: number;
  closedOn: string | null;
}) {
  const navigate = useNavigate();
  const byDate = new Map(boxes.map((box) => [box.date, box]));
  const months = [...new Set(boxes.map((box) => box.date.slice(0, 7)))].sort();
  const first = months[0] ?? "";
  const last = months[months.length - 1] ?? "";
  const todayMonth = localISODate().slice(0, 7);
  const [month, setMonth] = useState(() =>
    todayMonth < first ? first : todayMonth > last ? last : todayMonth,
  );

  const summary = (
    <p className="mt-4 text-muted">
      {doneCount} {doneCount === 1 ? "treatment" : "treatments"} done · {leaveCount}{" "}
      {leaveCount === 1 ? "leave" : "leaves"}
      {closedOn ? ` · closed ${formatLongDate(closedOn)}` : ""}
    </p>
  );

  if (!first) return summary;

  return (
    <div className="mt-6">
      <div className={monthSwitchClass}>
        <button
          type="button"
          className={monthPrevButtonClass}
          disabled={month <= first}
          onClick={() => setMonth(shiftMonth(month, -1))}
        >
          <PreviousMonthLabel />
        </button>
        <h2 className={monthTitleClass}>
          <MonthTitle month={month} compact />
        </h2>
        <button
          type="button"
          className={monthNextButtonClass}
          disabled={month >= last}
          onClick={() => setMonth(shiftMonth(month, 1))}
        >
          Next month
        </button>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-muted min-[376px]:gap-2">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((name) => (
          <div key={name}>{name}</div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1 min-[376px]:gap-2">
        {Array.from({ length: weekdayIndexMonday(`${month}-01`) }, (_, index) => (
          <div key={`${month}-lead-${index}`} />
        ))}
        {monthDates(month).map((date) => {
          const box = byDate.get(date);
          return (
            <button
              key={date}
              type="button"
              disabled={!box}
              className={`flex h-11 flex-col items-center justify-center rounded-lg text-xs disabled:cursor-default min-[376px]:h-14 min-[376px]:rounded-xl min-[376px]:text-sm ${dayClass(box)}`}
              onClick={() => navigate(`/?date=${date}`)}
            >
              <span>{Number(date.slice(-2))}</span>
              {box && box.kind === "leave" ? (
                <span className="text-[10px] leading-none">{box.side === "holiday" ? "Hol" : "Leave"}</span>
              ) : null}
            </button>
          );
        })}
      </div>
      {summary}
    </div>
  );
}

function dayClass(box: ChartBox | undefined): string {
  if (!box) return "text-muted";
  if (box.kind === "leave") return "bg-clay text-paper";
  if (box.status === "done") return "bg-pine text-paper";
  return "border border-line bg-card text-ink";
}

function BackToPatients() {
  return (
    <Link className="text-sm text-pine" to="/patients">
      Back to patients
    </Link>
  );
}
