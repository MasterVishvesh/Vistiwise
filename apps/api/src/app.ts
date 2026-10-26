import {
  boxOnDate,
  buildChart,
  createPatientSchema,
  dayTone,
  extendSchema,
  forgotPasswordSchema,
  loginSchema,
  monthDates,
  monthEarnings,
  nextOpenDate,
  registerSchema,
  resetPasswordSchema,
  setResultsSchema,
  weekdayIndexMonday,
  weekdaySunday,
  type ChartBox,
  type ResultKind,
} from "@physio/domain";
import type { Patient } from "@prisma/client";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { asDate, asIso, prisma } from "./db.js";
import { endSession, hashToken, HttpError, readBody, requireDoctor, startSession } from "./http.js";
import { hashPassword, verifyPassword } from "./password.js";

const backupSchema = z.object({
  version: z.literal(1),
  patients: z.array(
    z.object({
      id: z.string().min(1),
      publicCode: z.string().min(1),
      name: z.string().min(1),
      age: z.number().int(),
      gender: z.enum(["male", "female", "other"]),
      condition: z.string().min(1),
      placeType: z.enum(["hospital", "clinic", "home"]),
      placeName: z.string(),
      address: z.string().nullable(),
      landmark: z.string().nullable(),
      timeSlot: z.string(),
      timeEnd: z.string().default(""),
      daysOff: z.array(z.number().int().min(0).max(6)).max(6).default([]),
      feeType: z.enum(["per_visit", "package"]),
      feeAmount: z.number().int(),
      treatmentDays: z.number().int(),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      closedOn: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .nullable()
        .default(null),
    }),
  ),
  dayResults: z.array(
    z.object({
      id: z.string().min(1),
      patientId: z.string().min(1),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      result: z.enum(["done", "doctor_leave", "patient_leave"]),
      feeSnapshot: z.number().int().nullable(),
    }),
  ),
  extensions: z.array(
    z.object({
      id: z.string().min(1),
      patientId: z.string().min(1),
      extraDays: z.number().int(),
      extraAmount: z.number().int(),
      createdOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }),
  ),
  holidays: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).default([]),
});

function patientChart(
  patient: Patient & { dayResults: { date: Date; result: ResultKind }[] },
  holidays: string[],
) {
  return buildChart({
    startDate: asIso(patient.startDate),
    treatmentDays: patient.treatmentDays,
    daysOff: patient.daysOff,
    holidays,
    closedOn: patient.closedOn ? asIso(patient.closedOn) : null,
    results: patient.dayResults.map((result) => ({
      date: asIso(result.date),
      result: result.result,
    })),
  });
}

async function holidayDates(doctorId: string): Promise<string[]> {
  const holidays = await prisma.holiday.findMany({ where: { doctorId } });
  return holidays.map((holiday) => asIso(holiday.date));
}

function clock(value: string): string {
  return value.slice(0, 5);
}

function patientFields(input: {
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
}) {
  return {
    name: input.name,
    age: input.age,
    gender: input.gender,
    condition: input.condition,
    placeType: input.placeType,
    placeName: input.placeType === "home" ? input.placeName || "Home" : input.placeName,
    address: input.address || null,
    landmark: input.landmark || null,
    timeSlot: clock(input.timeSlot),
    timeEnd: clock(input.timeEnd),
    daysOff: input.daysOff,
    feeType: input.feeType,
    feeAmount: input.feeAmount,
    treatmentDays: input.treatmentDays,
    startDate: asDate(input.startDate),
  };
}

const weekdayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function assertDaysOffClear(results: { date: Date }[], daysOff: number[]) {
  if (daysOff.length === 0) return;
  const off = new Set(daysOff);
  const blocked = [
    ...new Set(results.map((result) => weekdaySunday(asIso(result.date))).filter((day) => off.has(day))),
  ];
  if (blocked.length === 0) return;
  const names = blocked.map((day) => weekdayName[day]).join(" and ");
  throw new HttpError(400, `Clear the ${names} visits before saving that day off.`);
}

function placeLabel(patient: Pick<Patient, "placeType" | "placeName">): string {
  if (patient.placeType === "home") return "Home";
  return patient.placeName;
}

export function createApp() {
  const app = new Hono();
  app.use(
    "*",
    cors({
      origin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
      credentials: true,
    }),
  );

  app.onError((error, c) => {
    if (error instanceof HttpError) return c.json({ error: error.message }, error.status);
    console.error(error);
    return c.json({ error: "Something went wrong." }, 500);
  });

  app.get("/health", (c) => c.json({ ok: true }));

  app.post("/auth/register", async (c) => {
    const input = await readBody(c, registerSchema);
    const email = input.email.toLowerCase();
    const existing = await prisma.doctor.findUnique({ where: { email } });
    if (existing) throw new HttpError(409, "An account with that email already exists.");
    const doctor = await prisma.doctor.create({
      data: {
        name: input.name,
        email,
        passwordHash: await hashPassword(input.password),
      },
    });
    await startSession(c, doctor.id);
    return c.json({ id: doctor.id, name: doctor.name, email: doctor.email });
  });

  app.post("/auth/login", async (c) => {
    const input = await readBody(c, loginSchema);
    const doctor = await prisma.doctor.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (!doctor || !(await verifyPassword(input.password, doctor.passwordHash))) {
      throw new HttpError(401, "Email or password is wrong.");
    }
    await startSession(c, doctor.id);
    return c.json({ id: doctor.id, name: doctor.name, email: doctor.email });
  });

  app.post("/auth/logout", async (c) => {
    await endSession(c);
    return c.json({ ok: true });
  });

  app.post("/auth/forgot-password", async (c) => {
    const input = await readBody(c, forgotPasswordSchema);
    const doctor = await prisma.doctor.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (!doctor) return c.json({ resetPath: null });

    const token = randomBytes(32).toString("hex");
    await prisma.passwordReset.deleteMany({ where: { doctorId: doctor.id, usedAt: null } });
    await prisma.passwordReset.create({
      data: {
        doctorId: doctor.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    const expose = process.env.DEV_EXPOSE_RESET_LINK === "true";
    return c.json({ resetPath: expose ? `/reset?token=${token}` : null });
  });

  app.post("/auth/reset-password", async (c) => {
    const input = await readBody(c, resetPasswordSchema);
    const reset = await prisma.passwordReset.findUnique({
      where: { tokenHash: hashToken(input.token) },
      include: { doctor: true },
    });
    if (!reset || reset.usedAt || reset.expiresAt.getTime() < Date.now()) {
      throw new HttpError(400, "This reset link has expired. Ask for a new one.");
    }
    const passwordHash = await hashPassword(input.password);
    await prisma.$transaction([
      prisma.doctor.update({ where: { id: reset.doctorId }, data: { passwordHash } }),
      prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
      prisma.session.deleteMany({ where: { doctorId: reset.doctorId } }),
    ]);
    await startSession(c, reset.doctorId);
    return c.json({ id: reset.doctor.id, name: reset.doctor.name, email: reset.doctor.email });
  });

  app.get("/auth/me", async (c) => {
    const doctor = await requireDoctor(c);
    return c.json({ id: doctor.id, name: doctor.name, email: doctor.email });
  });

  app.get("/patients", async (c) => {
    const doctor = await requireDoctor(c);
    const patients = await prisma.patient.findMany({
      where: { doctorId: doctor.id },
      include: { dayResults: true },
      orderBy: { name: "asc" },
    });
    const holidays = await holidayDates(doctor.id);
    return c.json({
      patients: patients.map((patient) => {
        const chart = patientChart(patient, holidays);
        return {
          id: patient.id,
          publicCode: patient.publicCode,
          name: patient.name,
          doneCount: chart.doneCount,
          treatmentDays: patient.treatmentDays,
          nextDate: patient.closedOn ? null : nextOpenDate(chart.boxes),
          closedOn: patient.closedOn ? asIso(patient.closedOn) : null,
        };
      }),
    });
  });

  app.post("/patients", async (c) => {
    const doctor = await requireDoctor(c);
    const input = await readBody(c, createPatientSchema);
    const patient = await prisma.$transaction(async (tx) => {
      const count = await tx.patient.count({ where: { doctorId: doctor.id } });
      return tx.patient.create({
        data: {
          doctorId: doctor.id,
          publicCode: `P-${String(count + 1).padStart(4, "0")}`,
          ...patientFields(input),
        },
      });
    });
    return c.json({ id: patient.id, publicCode: patient.publicCode }, 201);
  });

  app.get("/patients/:id", async (c) => {
    const doctor = await requireDoctor(c);
    const patient = await ownedPatient(doctor.id, c.req.param("id"));
    const chart = patientChart(patient, await holidayDates(doctor.id));
    return c.json({
      id: patient.id,
      publicCode: patient.publicCode,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      condition: patient.condition,
      placeType: patient.placeType,
      placeName: patient.placeName,
      address: patient.address,
      landmark: patient.landmark,
      timeSlot: patient.timeSlot,
      timeEnd: patient.timeEnd,
      daysOff: patient.daysOff,
      feeType: patient.feeType,
      feeAmount: patient.feeAmount,
      treatmentDays: patient.treatmentDays,
      startDate: asIso(patient.startDate),
      closedOn: patient.closedOn ? asIso(patient.closedOn) : null,
      label: chart.label,
      doneCount: chart.doneCount,
      boxes: chart.boxes,
    });
  });

  app.patch("/patients/:id", async (c) => {
    const doctor = await requireDoctor(c);
    const input = await readBody(c, createPatientSchema);
    const patient = await ownedPatient(doctor.id, c.req.param("id"));
    assertDaysOffClear(patient.dayResults, input.daysOff);
    await prisma.patient.update({
      where: { id: patient.id },
      data: patientFields(input),
    });
    return c.json({ ok: true });
  });

  app.post("/patients/:id/extend", async (c) => {
    const doctor = await requireDoctor(c);
    const input = await readBody(c, extendSchema);
    const patient = await ownedPatient(doctor.id, c.req.param("id"));
    if (patient.closedOn) throw new HttpError(400, "Reopen the course before adding days.");
    await prisma.$transaction([
      prisma.patient.update({
        where: { id: patient.id },
        data: { treatmentDays: { increment: input.extraDays } },
      }),
      prisma.extension.create({
        data: {
          patientId: patient.id,
          extraDays: input.extraDays,
          extraAmount: patient.feeType === "package" ? input.extraAmount : 0,
          createdOn: asDate(input.createdOn),
        },
      }),
    ]);
    return c.json({ treatmentDays: patient.treatmentDays + input.extraDays });
  });

  app.post("/patients/:id/close", async (c) => {
    const doctor = await requireDoctor(c);
    const input = await readBody(
      c,
      z.object({ closedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose the close date.") }),
    );
    const patient = await ownedPatient(doctor.id, c.req.param("id"));
    await prisma.patient.update({
      where: { id: patient.id },
      data: { closedOn: asDate(input.closedOn) },
    });
    return c.json({ ok: true });
  });

  app.post("/patients/:id/reopen", async (c) => {
    const doctor = await requireDoctor(c);
    const patient = await ownedPatient(doctor.id, c.req.param("id"));
    await prisma.patient.update({
      where: { id: patient.id },
      data: { closedOn: null },
    });
    return c.json({ ok: true });
  });

  app.get("/days/:date", async (c) => {
    const doctor = await requireDoctor(c);
    const date = dateParam(c.req.param("date"));
    const [patients, holidays] = await Promise.all([
      prisma.patient.findMany({
        where: { doctorId: doctor.id },
        include: { dayResults: true },
      }),
      holidayDates(doctor.id),
    ]);
    const rows = patients
      .flatMap((patient) => {
        const box = boxOnDate(patientChart(patient, holidays).boxes, date);
        if (!box) return [];
        return [
          {
            id: patient.id,
            publicCode: patient.publicCode,
            name: patient.name,
            age: patient.age,
            gender: patient.gender,
            condition: patient.condition,
            timeSlot: patient.timeSlot,
            timeEnd: patient.timeEnd,
            placeType: patient.placeType,
            placeName: placeLabel(patient),
            landmark: patient.landmark,
            status: statusFromBox(box),
          },
        ];
      })
      .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot) || a.name.localeCompare(b.name));

    const groups = new Map<string, typeof rows>();
    for (const row of rows) {
      const list = groups.get(row.placeName) ?? [];
      list.push(row);
      groups.set(row.placeName, list);
    }

    return c.json({
      date,
      holiday: holidays.includes(date),
      openCount: rows.filter((row) => row.status === "planned").length,
      groups: [...groups.entries()].map(([place, patientsInPlace]) => ({
        place,
        patients: patientsInPlace,
      })),
    });
  });

  app.post("/days/:date/results", async (c) => {
    const doctor = await requireDoctor(c);
    const date = dateParam(c.req.param("date"));
    const input = await readBody(c, setResultsSchema);
    const holidays = await holidayDates(doctor.id);

    await prisma.$transaction(async (tx) => {
      for (const item of input.items) {
        const patient = await tx.patient.findFirst({
          where: { id: item.patientId, doctorId: doctor.id },
          include: { dayResults: true },
        });
        if (!patient) throw new HttpError(404, "Patient not found.");
        const box = boxOnDate(patientChart(patient, holidays).boxes, date);
        if (!box) throw new HttpError(400, "That date is outside this course.");
        if (item.clear) {
          await tx.dayResult.deleteMany({
            where: { patientId: patient.id, date: asDate(date) },
          });
          continue;
        }
        if (!item.result) throw new HttpError(400, "Choose done or a leave.");
        const feeSnapshot =
          item.result === "done" && patient.feeType === "per_visit" ? patient.feeAmount : null;
        await tx.dayResult.upsert({
          where: { patientId_date: { patientId: patient.id, date: asDate(date) } },
          create: {
            patientId: patient.id,
            date: asDate(date),
            result: item.result,
            feeSnapshot,
          },
          update: { result: item.result, feeSnapshot },
        });
      }
    });

    return c.json({ ok: true });
  });

  app.post("/days/:date/holiday", async (c) => {
    const doctor = await requireDoctor(c);
    const date = dateParam(c.req.param("date"));
    const input = await readBody(c, z.object({ enabled: z.boolean() }));
    if (input.enabled) {
      await prisma.holiday.upsert({
        where: { doctorId_date: { doctorId: doctor.id, date: asDate(date) } },
        create: { doctorId: doctor.id, date: asDate(date) },
        update: {},
      });
    } else {
      await prisma.holiday.deleteMany({
        where: { doctorId: doctor.id, date: asDate(date) },
      });
    }
    return c.json({ holiday: input.enabled });
  });

  app.get("/calendar", async (c) => {
    const doctor = await requireDoctor(c);
    const month = c.req.query("month");
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      throw new HttpError(400, "Choose a month.");
    }
    const [patients, holidays] = await Promise.all([
      prisma.patient.findMany({
        where: { doctorId: doctor.id },
        include: { dayResults: true },
      }),
      holidayDates(doctor.id),
    ]);
    const boxesByDate = new Map<string, ChartBox[]>();
    for (const patient of patients) {
      for (const box of patientChart(patient, holidays).boxes) {
        if (!box.date.startsWith(month)) continue;
        const list = boxesByDate.get(box.date) ?? [];
        list.push(box);
        boxesByDate.set(box.date, list);
      }
    }
    return c.json({
      month,
      lead: weekdayIndexMonday(`${month}-01`),
      days: monthDates(month).map((date) => {
        const boxes = boxesByDate.get(date) ?? [];
        return {
          date,
          tone: dayTone(boxes),
          doneCount: boxes.filter((box) => box.kind === "treatment" && box.status === "done").length,
        };
      }),
    });
  });

  app.get("/earnings", async (c) => {
    const doctor = await requireDoctor(c);
    const month = c.req.query("month");
    if (!month || !/^\d{4}-\d{2}$/.test(month)) throw new HttpError(400, "Choose a month.");
    const patients = await prisma.patient.findMany({
      where: { doctorId: doctor.id },
      include: { dayResults: true, extensions: true },
    });
    const earnings = monthEarnings({
      month,
      patients: patients.map((patient) => ({
        id: patient.id,
        name: patient.name,
        feeType: patient.feeType,
        feeAmount: patient.feeAmount,
        startDate: asIso(patient.startDate),
      })),
      results: patients.flatMap((patient) =>
        patient.dayResults.map((result) => ({
          patientId: patient.id,
          date: asIso(result.date),
          result: result.result,
          feeSnapshot: result.feeSnapshot,
        })),
      ),
      extensions: patients.flatMap((patient) =>
        patient.extensions.map((extension) => ({
          patientId: patient.id,
          createdOn: asIso(extension.createdOn),
          extraAmount: extension.extraAmount,
        })),
      ),
    });
    return c.json({ month, ...earnings });
  });

  app.get("/backup", async (c) => {
    const doctor = await requireDoctor(c);
    const patients = await prisma.patient.findMany({
      where: { doctorId: doctor.id },
      include: { dayResults: true, extensions: true },
      orderBy: { publicCode: "asc" },
    });
    return c.json({
      version: 1,
      patients: patients.map((patient) => ({
        id: patient.id,
        publicCode: patient.publicCode,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        condition: patient.condition,
        placeType: patient.placeType,
        placeName: patient.placeName,
        address: patient.address,
        landmark: patient.landmark,
        timeSlot: patient.timeSlot,
        timeEnd: patient.timeEnd,
        daysOff: patient.daysOff,
        feeType: patient.feeType,
        feeAmount: patient.feeAmount,
        treatmentDays: patient.treatmentDays,
        startDate: asIso(patient.startDate),
        closedOn: patient.closedOn ? asIso(patient.closedOn) : null,
      })),
      dayResults: patients.flatMap((patient) =>
        patient.dayResults.map((result) => ({
          id: result.id,
          patientId: patient.id,
          date: asIso(result.date),
          result: result.result,
          feeSnapshot: result.feeSnapshot,
        })),
      ),
      extensions: patients.flatMap((patient) =>
        patient.extensions.map((extension) => ({
          id: extension.id,
          patientId: patient.id,
          extraDays: extension.extraDays,
          extraAmount: extension.extraAmount,
          createdOn: asIso(extension.createdOn),
        })),
      ),
      holidays: await holidayDates(doctor.id),
    });
  });

  app.post("/backup", async (c) => {
    const doctor = await requireDoctor(c);
    const input = await readBody(c, backupSchema);
    const patientIds = new Set(input.patients.map((patient) => patient.id));
    const dangling = [...input.dayResults, ...input.extensions].some(
      (row) => !patientIds.has(row.patientId),
    );
    if (dangling) throw new HttpError(400, "The backup file does not match its patients.");

    await prisma.$transaction(async (tx) => {
      await tx.holiday.deleteMany({ where: { doctorId: doctor.id } });
      await tx.extension.deleteMany({ where: { patient: { doctorId: doctor.id } } });
      await tx.dayResult.deleteMany({ where: { patient: { doctorId: doctor.id } } });
      await tx.patient.deleteMany({ where: { doctorId: doctor.id } });
      if (input.patients.length === 0) return;
      await tx.patient.createMany({
        data: input.patients.map((patient) => ({
          ...patient,
          doctorId: doctor.id,
          startDate: asDate(patient.startDate),
          closedOn: patient.closedOn ? asDate(patient.closedOn) : null,
        })),
      });
      if (input.dayResults.length > 0) {
        await tx.dayResult.createMany({
          data: input.dayResults.map((result) => ({
            id: result.id,
            patientId: result.patientId,
            date: asDate(result.date),
            result: result.result,
            feeSnapshot: result.feeSnapshot,
          })),
        });
      }
      if (input.extensions.length > 0) {
        await tx.extension.createMany({
          data: input.extensions.map((extension) => ({
            id: extension.id,
            patientId: extension.patientId,
            extraDays: extension.extraDays,
            extraAmount: extension.extraAmount,
            createdOn: asDate(extension.createdOn),
          })),
        });
      }
      if (input.holidays.length > 0) {
        await tx.holiday.createMany({
          data: input.holidays.map((date) => ({ doctorId: doctor.id, date: asDate(date) })),
        });
      }
    });
    return c.json({ patients: input.patients.length });
  });

  return app;
}

async function ownedPatient(doctorId: string, patientId: string) {
  const patient = await prisma.patient.findFirst({
    where: {
      doctorId,
      OR: [{ id: patientId }, { publicCode: patientId }],
    },
    include: { dayResults: true },
  });
  if (!patient) throw new HttpError(404, "Patient not found.");
  return patient;
}

function dateParam(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new HttpError(400, "Choose a date.");
  return value;
}

function statusFromBox(box: ChartBox): "planned" | "holiday" | ResultKind {
  if (box.kind === "leave") {
    if (box.side === "holiday") return "holiday";
    return box.side === "doctor" ? "doctor_leave" : "patient_leave";
  }
  return box.status === "done" ? "done" : "planned";
}
