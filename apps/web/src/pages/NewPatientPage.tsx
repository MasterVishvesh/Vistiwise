import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../api";
import { localISODate } from "../format";
import { PatientForm, type PatientDraft, type PatientFormValues } from "./PatientForm";

export function NewPatientPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [values] = useState<PatientFormValues>(() => ({
    name: "",
    age: "",
    gender: "female",
    condition: "",
    placeType: "clinic",
    placeName: "",
    address: "",
    landmark: "",
    startDate: localISODate(),
    treatmentDays: "15",
    timeSlot: "10:00",
    timeEnd: "10:30",
    daysOff: [],
    feeType: "per_visit",
    feeAmount: "500",
  }));

  async function save(draft: PatientDraft) {
    setPending(true);
    setError("");
    try {
      await api("/patients", {
        method: "POST",
        body: JSON.stringify(draft),
      });
      navigate("/patients");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not save the patient.");
      setPending(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-2 md:py-8">
      <h1 className="font-serif text-4xl">New patient</h1>
      <p className="mt-2 text-muted">The chart follows the start date and skips the days off.</p>
      <PatientForm
        values={values}
        submitLabel="Save patient"
        pending={pending}
        error={error}
        onSubmit={save}
      />
    </main>
  );
}
