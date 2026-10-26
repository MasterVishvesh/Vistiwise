import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError, type PatientSummary } from "../api";
import { formatLongDate } from "../format";

export function PatientsPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ patients: PatientSummary[] }>("/patients")
      .then((response) => setPatients(response.patients))
      .catch((caught) => {
        setError(caught instanceof ApiError ? caught.message : "Could not load patients.");
      });
  }, []);

  const shown = patients.filter((patient) => {
    const haystack = `${patient.name} ${patient.publicCode}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  return (
    <main className="mx-auto max-w-3xl px-5 py-2 md:py-8">
      <div className="flex flex-col gap-3 min-[376px]:flex-row min-[376px]:items-end min-[376px]:justify-between">
        <h1 className="font-serif text-3xl min-[376px]:text-4xl">Patients</h1>
        <button className="hidden h-11 items-center rounded-xl bg-ink px-4 text-paper md:inline-flex" onClick={() => navigate("/patients/new")}>
          New patient
        </button>
      </div>
      <input
        className="mt-5 h-12 w-full rounded-xl border border-line bg-card px-3"
        placeholder="Search name or id"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-card">
        {shown.map((patient) => (
          <button
            key={patient.id}
            className="block w-full border-b border-line px-4 py-3 text-left last:border-b-0"
            onClick={() => navigate(`/patients/${patient.publicCode}`)}
          >
            <p className="font-medium">
              {patient.publicCode} {patient.name}
            </p>
            <p className="text-sm text-muted">
              {patient.doneCount} of {patient.treatmentDays}
              {patient.closedOn
                ? ` · closed ${formatLongDate(patient.closedOn)}`
                : patient.nextDate
                  ? ` · next ${formatLongDate(patient.nextDate)}`
                  : " · course complete"}
            </p>
          </button>
        ))}
        {shown.length === 0 ? <p className="px-4 py-6 text-muted">No patients yet.</p> : null}
      </div>
    </main>
  );
}
