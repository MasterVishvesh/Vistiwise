import { useState, type FormEvent } from "react";
import { WEEKDAYS } from "../format";

export type PatientDraft = {
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  condition: string;
  placeType: "hospital" | "clinic" | "home";
  placeName: string;
  address: string;
  landmark: string;
  timeSlot: string;
  timeEnd: string;
  daysOff: number[];
  feeType: "per_visit" | "package";
  feeAmount: number;
  treatmentDays: number;
  startDate: string;
};

export type PatientFormValues = {
  name: string;
  age: string;
  gender: "male" | "female" | "other";
  condition: string;
  placeType: "hospital" | "clinic" | "home";
  placeName: string;
  address: string;
  landmark: string;
  startDate: string;
  treatmentDays: string;
  timeSlot: string;
  timeEnd: string;
  daysOff: number[];
  feeType: "per_visit" | "package";
  feeAmount: string;
};

export function PatientForm({
  values,
  submitLabel,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  values: PatientFormValues;
  submitLabel: string;
  pending: boolean;
  error: string;
  onSubmit: (draft: PatientDraft) => Promise<void>;
  onCancel?: () => void;
}) {
  const [placeType, setPlaceType] = useState(values.placeType);
  const [feeType, setFeeType] = useState(values.feeType);
  const [daysOff, setDaysOff] = useState(values.daysOff);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await onSubmit({
      name: String(data.get("name") ?? ""),
      age: Number(data.get("age")),
      gender: String(data.get("gender")) as PatientDraft["gender"],
      condition: String(data.get("condition") ?? ""),
      placeType,
      placeName: String(data.get("placeName") ?? ""),
      address: String(data.get("address") ?? ""),
      landmark: String(data.get("landmark") ?? ""),
      timeSlot: String(data.get("timeSlot") ?? ""),
      timeEnd: String(data.get("timeEnd") ?? ""),
      daysOff,
      feeType,
      feeAmount: Number(data.get("feeAmount")),
      treatmentDays: Number(data.get("treatmentDays")),
      startDate: String(data.get("startDate") ?? ""),
    });
  }

  function toggleDay(day: number) {
    setDaysOff((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    );
  }

  return (
    <form className="mt-6 flex flex-col gap-4" onSubmit={submit}>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Field name="name" label="Name" defaultValue={values.name} />
      <div className="grid grid-cols-2 gap-3">
        <Field name="age" label="Age" type="number" min={0} max={120} defaultValue={values.age} />
        <label className="block text-sm">
          <span className="text-muted">Gender</span>
          <select
            name="gender"
            className="mt-1 h-12 w-full rounded-xl border border-line bg-card px-3"
            defaultValue={values.gender}
          >
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </label>
      </div>
      <Field name="condition" label="Condition" defaultValue={values.condition} />
      <div className="flex flex-wrap gap-2">
        {(["clinic", "hospital", "home"] as const).map((place) => (
          <button
            key={place}
            type="button"
            className={`h-10 rounded-lg px-3 capitalize ${placeType === place ? "bg-ink text-paper" : "border border-line bg-card"}`}
            onClick={() => setPlaceType(place)}
          >
            {place}
          </button>
        ))}
      </div>
      {placeType === "home" ? (
        <>
          <Field name="address" label="Address" required={false} defaultValue={values.address} />
          <Field name="landmark" label="Landmark" required={false} defaultValue={values.landmark} />
        </>
      ) : (
        <Field name="placeName" label="Place name" defaultValue={values.placeName} />
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field name="startDate" label="Start date" type="date" defaultValue={values.startDate} />
        <Field name="treatmentDays" label="Treatment days" type="number" defaultValue={values.treatmentDays} />
      </div>
      <div>
        <p className="text-sm text-muted">Days off</p>
        <p className="mt-1 text-sm text-muted">Treatment skips these weekdays and continues on the next working day.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {WEEKDAYS.map((weekday) => {
            const selected = daysOff.includes(weekday.day);
            return (
              <button
                key={weekday.day}
                type="button"
                aria-pressed={selected}
                className={`h-10 rounded-lg px-3 ${selected ? "bg-ink text-paper" : "border border-line bg-card"}`}
                onClick={() => toggleDay(weekday.day)}
              >
                {weekday.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field name="timeSlot" label="From" type="time" defaultValue={values.timeSlot} />
        <Field name="timeEnd" label="To" type="time" defaultValue={values.timeEnd} />
      </div>
      <div className="flex flex-wrap gap-2">
        {(["per_visit", "package"] as const).map((fee) => (
          <button
            key={fee}
            type="button"
            className={`h-10 rounded-lg px-3 ${feeType === fee ? "bg-ink text-paper" : "border border-line bg-card"}`}
            onClick={() => setFeeType(fee)}
          >
            {fee === "per_visit" ? "Per visit" : "Package"}
          </button>
        ))}
      </div>
      <Field name="feeAmount" label="Amount in rupees" type="number" min={0} defaultValue={values.feeAmount} />
      <div className="flex flex-wrap gap-2">
        <button className="h-12 rounded-xl bg-pine px-5 text-paper disabled:opacity-60" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </button>
        {onCancel ? (
          <button type="button" className="h-12 rounded-xl border border-line px-5" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  defaultValue,
  required = true,
  min,
  max,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  min?: number;
  max?: number;
}) {
  return (
    <label className="block text-sm">
      <span className="text-muted">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        min={min}
        max={max}
        defaultValue={defaultValue}
        onInput={(event) => event.currentTarget.setCustomValidity("")}
        onInvalid={(event) => {
          const input = event.currentTarget;
          if (input.validity.rangeOverflow && name === "age") {
            input.setCustomValidity("Age must be 120 or less.");
          } else if (input.validity.rangeUnderflow && name === "age") {
            input.setCustomValidity("Age must be 0 or more.");
          }
        }}
        className="mt-1 h-12 w-full rounded-xl border border-line bg-card px-3"
      />
    </label>
  );
}
