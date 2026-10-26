import { describe, expect, it } from "vitest";
import { buildChart, dayTone, nextOpenDate } from "./chart.js";
import { monthEarnings } from "./money.js";

describe("buildChart", () => {
  it("lays 15 treatments on consecutive days", () => {
    const chart = buildChart({
      startDate: "2026-10-12",
      treatmentDays: 15,
      results: [],
    });

    expect(chart.label).toBe("15 + 0");
    expect(chart.boxes).toHaveLength(15);
    expect(chart.boxes[0]).toMatchObject({
      date: "2026-10-12",
      kind: "treatment",
      index: 1,
      status: "planned",
    });
    expect(chart.boxes[14]).toMatchObject({ date: "2026-10-26", index: 15 });
    expect(nextOpenDate(chart.boxes)).toBe("2026-10-12");
  });

  it("moves a Monday miss to Tuesday and labels 15 + 1", () => {
    const chart = buildChart({
      startDate: "2026-10-12",
      treatmentDays: 15,
      results: [{ date: "2026-10-12", result: "patient_leave" }],
    });

    expect(chart.label).toBe("15 + 1");
    expect(chart.boxes[0]).toMatchObject({
      date: "2026-10-12",
      kind: "leave",
      side: "patient",
    });
    expect(chart.boxes[1]).toMatchObject({
      date: "2026-10-13",
      kind: "treatment",
      index: 1,
      status: "planned",
    });
    expect(chart.boxes.at(-1)).toMatchObject({ date: "2026-10-27", index: 15 });
    expect(dayTone([chart.boxes[0]])).toBe("leave");
  });

  it("counts doctor leave and patient leave together", () => {
    const chart = buildChart({
      startDate: "2026-10-12",
      treatmentDays: 3,
      results: [
        { date: "2026-10-12", result: "doctor_leave" },
        { date: "2026-10-13", result: "done" },
        { date: "2026-10-14", result: "patient_leave" },
      ],
    });

    expect(chart.label).toBe("3 + 2");
    expect(chart.doneCount).toBe(1);
    expect(chart.boxes.map((box) => box.date)).toEqual([
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
      "2026-10-16",
    ]);
    expect(dayTone(chart.boxes.filter((box) => box.date === "2026-10-13"))).toBe("worked");
  });

  it("skips Saturday and Sunday without using a treatment day", () => {
    const chart = buildChart({
      startDate: "2026-10-17",
      treatmentDays: 3,
      daysOff: [6, 0],
      results: [],
    });

    expect(chart.label).toBe("3 + 0");
    expect(chart.boxes.map((box) => box.date)).toEqual(["2026-10-19", "2026-10-20", "2026-10-21"]);
  });

  it("stops a discontinued course on the close date", () => {
    const chart = buildChart({
      startDate: "2026-10-12",
      treatmentDays: 5,
      closedOn: "2026-10-14",
      results: [{ date: "2026-10-12", result: "done" }],
    });

    expect(chart.boxes.map((box) => box.date)).toEqual(["2026-10-12", "2026-10-13"]);
    expect(chart.doneCount).toBe(1);
    expect(nextOpenDate(chart.boxes)).toBe("2026-10-13");
  });

  it("gives every patient the government holiday and moves the treatment", () => {
    const chart = buildChart({
      startDate: "2026-10-12",
      treatmentDays: 3,
      holidays: ["2026-10-13"],
      results: [],
    });

    expect(chart.label).toBe("3 + 1");
    expect(chart.boxes).toEqual([
      { date: "2026-10-12", kind: "treatment", index: 1, status: "planned" },
      { date: "2026-10-13", kind: "leave", side: "holiday" },
      { date: "2026-10-14", kind: "treatment", index: 2, status: "planned" },
      { date: "2026-10-15", kind: "treatment", index: 3, status: "planned" },
    ]);
    expect(dayTone([chart.boxes[1]])).toBe("leave");
  });
});

describe("monthEarnings", () => {
  it("adds per-visit fees on done days and counts a package once", () => {
    const earnings = monthEarnings({
      month: "2026-10",
      patients: [
        {
          id: "ravi",
          name: "Ravi Shah",
          feeType: "per_visit",
          feeAmount: 500,
          startDate: "2026-10-12",
        },
        {
          id: "meera",
          name: "Meera Joshi",
          feeType: "package",
          feeAmount: 1000,
          startDate: "2026-10-01",
        },
      ],
      results: [
        { patientId: "ravi", date: "2026-10-13", result: "done", feeSnapshot: 500 },
        { patientId: "ravi", date: "2026-10-14", result: "done", feeSnapshot: 500 },
        { patientId: "ravi", date: "2026-10-12", result: "patient_leave", feeSnapshot: null },
      ],
      extensions: [{ patientId: "meera", createdOn: "2026-10-20", extraAmount: 200 }],
    });

    expect(earnings.total).toBe(2200);
    expect(earnings.lines).toEqual([
      { patientId: "ravi", name: "Ravi Shah", amount: 1000, note: "2 visits" },
      { patientId: "meera", name: "Meera Joshi", amount: 1200, note: "Package" },
    ]);
    expect(earnings.carried).toEqual([]);
  });

  it("keeps a package in the start month when later visits are marked done", () => {
    const earnings = monthEarnings({
      month: "2026-10",
      patients: [
        {
          id: "swaroop",
          name: "Swaroop",
          feeType: "package",
          feeAmount: 3500,
          startDate: "2026-09-23",
        },
      ],
      results: [
        { patientId: "swaroop", date: "2026-10-05", result: "done", feeSnapshot: null },
        { patientId: "swaroop", date: "2026-10-06", result: "done", feeSnapshot: null },
        { patientId: "swaroop", date: "2026-10-01", result: "doctor_leave", feeSnapshot: null },
      ],
      extensions: [],
    });

    expect(earnings.total).toBe(0);
    expect(earnings.lines).toEqual([]);
    expect(earnings.carried).toEqual([
      {
        patientId: "swaroop",
        name: "Swaroop",
        amount: 3500,
        countedIn: "2026-09",
        doneCount: 2,
      },
    ]);
  });
});
