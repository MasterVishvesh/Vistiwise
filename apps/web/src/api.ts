export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(body?.error ?? "Request failed.", response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export type Doctor = { id: string; name: string; email: string };

export type DayPatient = {
  id: string;
  publicCode: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  condition: string;
  timeSlot: string;
  timeEnd: string;
  placeType: "hospital" | "clinic" | "home";
  placeName: string;
  landmark: string | null;
  status: "planned" | "done" | "doctor_leave" | "patient_leave" | "holiday";
};

export type DayResponse = {
  date: string;
  holiday: boolean;
  openCount: number;
  groups: { place: string; patients: DayPatient[] }[];
};

export type PatientSummary = {
  id: string;
  publicCode: string;
  name: string;
  doneCount: number;
  treatmentDays: number;
  nextDate: string | null;
  closedOn: string | null;
};

export type ChartBox =
  | { date: string; kind: "treatment"; index: number; status: "planned" | "done" }
  | { date: string; kind: "leave"; side: "doctor" | "patient" | "holiday" };

export type PatientDetail = {
  id: string;
  publicCode: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  condition: string;
  placeType: "hospital" | "clinic" | "home";
  placeName: string;
  address: string | null;
  landmark: string | null;
  timeSlot: string;
  timeEnd: string;
  daysOff: number[];
  feeType: "per_visit" | "package";
  feeAmount: number;
  treatmentDays: number;
  startDate: string;
  closedOn: string | null;
  label: string;
  doneCount: number;
  boxes: ChartBox[];
};
