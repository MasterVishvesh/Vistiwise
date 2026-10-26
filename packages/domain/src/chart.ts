import { addDays, weekdaySunday } from "./dates.js";

export type ResultKind = "done" | "doctor_leave" | "patient_leave";

export type ChartBox =
  | {
      date: string;
      kind: "treatment";
      index: number;
      status: "planned" | "done";
    }
  | {
      date: string;
      kind: "leave";
      side: "doctor" | "patient" | "holiday";
    };

export type DayTone = "worked" | "leave" | "upcoming" | "empty";

export type StoredResult = {
  date: string;
  result: ResultKind;
};

const LOOP_GUARD = 2000;

export function buildChart(input: {
  startDate: string;
  treatmentDays: number;
  results: StoredResult[];
  daysOff?: number[];
  holidays?: string[];
  closedOn?: string | null;
}): {
  boxes: ChartBox[];
  leaveCount: number;
  doneCount: number;
  label: string;
} {
  const byDate = new Map(input.results.map((result) => [result.date, result.result]));
  const daysOff = new Set(input.daysOff ?? []);
  const holidays = new Set(input.holidays ?? []);
  const boxes: ChartBox[] = [];
  let remaining = input.treatmentDays;
  let index = 1;
  let date = input.startDate;

  for (let step = 0; remaining > 0 && step < LOOP_GUARD; step += 1) {
    if (input.closedOn && date > input.closedOn) break;
    if (daysOff.has(weekdaySunday(date))) {
      date = addDays(date, 1);
      continue;
    }
    const result = byDate.get(date);
    const closing = input.closedOn === date;
    if (holidays.has(date) && result !== "done" && result !== "doctor_leave" && result !== "patient_leave") {
      boxes.push({ date, kind: "leave", side: "holiday" });
      if (closing) break;
      date = addDays(date, 1);
      continue;
    }
    if (closing && result !== "done" && result !== "doctor_leave" && result !== "patient_leave") {
      break;
    }
    if (result === "doctor_leave" || result === "patient_leave") {
      boxes.push({
        date,
        kind: "leave",
        side: result === "doctor_leave" ? "doctor" : "patient",
      });
    } else {
      boxes.push({
        date,
        kind: "treatment",
        index,
        status: result === "done" ? "done" : "planned",
      });
      index += 1;
      remaining -= 1;
    }
    if (closing) break;
    date = addDays(date, 1);
  }

  const leaveCount = boxes.filter((box) => box.kind === "leave").length;
  const doneCount = boxes.filter(
    (box) => box.kind === "treatment" && box.status === "done",
  ).length;

  return {
    boxes,
    leaveCount,
    doneCount,
    label: `${input.treatmentDays} + ${leaveCount}`,
  };
}

export function nextOpenDate(boxes: ChartBox[]): string | null {
  const next = boxes.find((box) => box.kind === "treatment" && box.status === "planned");
  return next?.date ?? null;
}

export function boxOnDate(boxes: ChartBox[], date: string): ChartBox | undefined {
  return boxes.find((box) => box.date === date);
}

export function dayTone(boxes: ChartBox[]): DayTone {
  if (boxes.length === 0) return "empty";
  if (boxes.some((box) => box.kind === "treatment" && box.status === "done")) {
    return "worked";
  }
  if (boxes.some((box) => box.kind === "treatment" && box.status === "planned")) {
    return "upcoming";
  }
  if (boxes.some((box) => box.kind === "leave")) return "leave";
  return "empty";
}
