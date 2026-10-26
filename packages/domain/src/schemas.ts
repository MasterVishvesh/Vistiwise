import { z } from "zod";

export const resultKindSchema = z.enum(["done", "doctor_leave", "patient_leave"]);

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(180),
  password: z.string().min(8).max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8).max(200),
});

export const createPatientSchema = z
  .object({
    name: z.string().trim().min(1, "Add the patient's name.").max(120, "Name must be 120 characters or less."),
    age: z
      .number({ invalid_type_error: "Age must be a whole number." })
      .int("Age must be a whole number.")
      .min(0, "Age must be 0 or more.")
      .max(120, "Age must be 120 or less."),
    gender: z.enum(["male", "female", "other"]),
    condition: z.string().trim().min(1).max(160),
    placeType: z.enum(["hospital", "clinic", "home"]),
    placeName: z.string().trim().max(160).optional().default(""),
    address: z.string().trim().max(240).optional().default(""),
    landmark: z.string().trim().max(160).optional().default(""),
    timeSlot: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Choose a start time."),
    timeEnd: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Choose an end time."),
    daysOff: z
      .array(z.number().int().min(0).max(6))
      .max(6, "Leave at least one working day.")
      .default([]),
    feeType: z.enum(["per_visit", "package"]),
    feeAmount: z
      .number({ invalid_type_error: "Amount must be a whole number of rupees." })
      .int("Amount must be a whole number of rupees.")
      .min(0, "Amount must be 0 or more.")
      .max(10_000_000, "Amount must be 1,00,00,000 or less."),
    treatmentDays: z.number().int().min(1, "Add at least 1 treatment day.").max(366, "Treatment days must be 366 or less."),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .superRefine((value, context) => {
    const [startHour, startMinute] = value.timeSlot.split(":").map(Number);
    const [endHour, endMinute] = value.timeEnd.split(":").map(Number);
    if (endHour * 60 + endMinute <= startHour * 60 + startMinute) {
      context.addIssue({
        code: "custom",
        message: "End time must be after the start time.",
        path: ["timeEnd"],
      });
    }
    if (new Set(value.daysOff).size !== value.daysOff.length) {
      context.addIssue({
        code: "custom",
        message: "Choose each day off once.",
        path: ["daysOff"],
      });
    }
    if (value.placeType === "home") {
      if (!value.address && !value.landmark) {
        context.addIssue({
          code: "custom",
          message: "Add an address or a landmark.",
          path: ["landmark"],
        });
      }
      return;
    }
    if (!value.placeName) {
      context.addIssue({
        code: "custom",
        message: "Add the place name.",
        path: ["placeName"],
      });
    }
  });

export const extendSchema = z.object({
  extraDays: z.number().int().min(1).max(366),
  extraAmount: z.number().int().min(0).max(10_000_000).default(0),
  createdOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const setResultsSchema = z.object({
  items: z
    .array(
      z.object({
        patientId: z.string().min(1),
        result: resultKindSchema.optional(),
        clear: z.boolean().optional(),
      }),
    )
    .min(1),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
