import type { ResultKind } from "./chart.js";

export type EarningPatient = {
  id: string;
  name: string;
  feeType: "per_visit" | "package";
  feeAmount: number;
  startDate: string;
};

export type EarningResult = {
  patientId: string;
  date: string;
  result: ResultKind;
  feeSnapshot: number | null;
};

export type EarningExtension = {
  patientId: string;
  createdOn: string;
  extraAmount: number;
};

export type EarningLine = {
  patientId: string;
  name: string;
  amount: number;
  note: string;
};

export type CarriedPackage = {
  patientId: string;
  name: string;
  amount: number;
  countedIn: string;
  doneCount: number;
};

function doneThisMonth(results: EarningResult[], patientId: string, month: string): EarningResult[] {
  return results.filter(
    (result) => result.patientId === patientId && result.result === "done" && result.date.startsWith(month),
  );
}

function visitNote(count: number): string {
  return count === 1 ? "1 visit" : `${count} visits`;
}

export function monthEarnings(input: {
  month: string;
  patients: EarningPatient[];
  results: EarningResult[];
  extensions: EarningExtension[];
}): { total: number; lines: EarningLine[]; carried: CarriedPackage[] } {
  const lines: EarningLine[] = [];
  const carried: CarriedPackage[] = [];

  for (const patient of input.patients) {
    const done = doneThisMonth(input.results, patient.id, input.month);
    if (patient.feeType === "per_visit") {
      const amount = done.reduce((sum, result) => sum + (result.feeSnapshot ?? 0), 0);
      if (amount > 0) {
        lines.push({
          patientId: patient.id,
          name: patient.name,
          amount,
          note: visitNote(done.length),
        });
      }
      continue;
    }

    const packageAmount = patient.startDate.startsWith(input.month) ? patient.feeAmount : 0;
    const extensionAmount = input.extensions
      .filter(
        (extension) => extension.patientId === patient.id && extension.createdOn.startsWith(input.month),
      )
      .reduce((sum, extension) => sum + extension.extraAmount, 0);
    const amount = packageAmount + extensionAmount;
    if (amount > 0) {
      lines.push({
        patientId: patient.id,
        name: patient.name,
        amount,
        note: packageAmount > 0 ? "Package" : "Extra package amount",
      });
    }
    if (packageAmount === 0 && done.length > 0 && patient.feeAmount > 0) {
      carried.push({
        patientId: patient.id,
        name: patient.name,
        amount: patient.feeAmount,
        countedIn: patient.startDate.slice(0, 7),
        doneCount: done.length,
      });
    }
  }

  return {
    total: lines.reduce((sum, line) => sum + line.amount, 0),
    lines,
    carried,
  };
}
