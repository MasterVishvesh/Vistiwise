# Architecture

The app runs on the doctor's machine during this stage. PostgreSQL holds the records. The same API and the same database shape move to AWS when the paid plan is in place. The chart is calculated whenever a screen opens. It is not stored as a row that gets moved.

## Records

**Doctor.** Name, email, and a password hash. A session cookie ties every later request to that doctor.

**Patient.** The fields in [Product rules](product.md). Also: fee type (`per_visit` or `package`), fee amount in rupees, treatment-day count, and start date.

**Day result.** One row per patient per date.

| Field | Rule |
| --- | --- |
| Patient and date | Unique together. |
| Result | `done`, `doctor_leave`, or `patient_leave`. |
| Fee snapshot | On `done`, when the fee is per visit: the rupee amount that applied that day. |

**Extension.** Extra treatment days added later, the date they were added, and any extra package amount.

A backup file is a JSON copy of that doctor's patients, day results, and extensions.

## Chart calculation

```text
remaining = patient.treatmentDays
date = patient.startDate
index = 1
while remaining > 0:
  result = dayResult for this patient on date
  if result is doctor_leave or patient_leave:
    draw a leave box on date
  else:
    draw treatment index on date
    if result is done, mark that box done
    index = index + 1
    remaining = remaining - 1
  date = the next calendar day
label = treatmentDays + number of leave boxes
```

Extend increases `treatmentDays` and writes an extension row. The loop places the new treatments after the current last box.

Today's list is every patient whose walk places a treatment on that date. The screen shows the row even after it is closed, so the doctor can change it.

The browser sends the doctor's local date. The server does not guess "today" from UTC.

## Close a day

Closing a day writes day results. It does not edit future rows.

1. Load the patients who have a box on that date.
2. **Mark all done** writes `done` for every row that is still open. Rows already set to a leave stay as they are.
3. **Not done** writes `doctor_leave` or `patient_leave` for that patient.
4. **Doctor leave for everyone** writes `doctor_leave` for every still-open row.
5. The chart is rebuilt from the records.

Replacing a day result, or clearing it, rebuilds the course from the start date.

## Final stack

| Part | Tool | Role |
| --- | --- | --- |
| Language | TypeScript | Shared patient, day-result, chart, and money types |
| Runtime | Node.js 22 or newer | API locally now. Node 22 is installed on this machine. |
| Screens | React, Vite, React Router, Tailwind CSS | Today, month, patients, chart, money, account |
| Checks | Zod | Patient form, extend, close-day, and login |
| API | Hono | Auth, patients, day results, calendar, earnings, backup |
| Database access | Prisma | Schema and queries |
| Database now | PostgreSQL 16 in Docker | The database used for local production testing |
| Database on AWS | Amazon RDS for PostgreSQL | The same schema, after the paid plan |
| API on AWS | Amazon ECS Express Mode on Fargate | The same API container. App Runner is closed to new accounts. |
| API address | Application Load Balancer | Stable HTTPS address in front of the container |
| Web files on AWS | Amazon S3 and CloudFront | The built Vite site |
| Image registry | Amazon ECR | The API image ECS runs |
| Secrets on AWS | AWS Secrets Manager | The database URL and cookie settings |
| Login | Email, password, scrypt, httpOnly cookie | Sessions live in PostgreSQL |
| Tests | Vitest | Chart labels, the Monday-to-Tuesday shift, and earnings |
| App install | Web manifest now. A service worker and on-device copy before go-live. Capacitor after the screens are in daily use. | Phone home screen and laptop window. Store packages later. |

The on-device copy (IndexedDB) is the piece that lets a marked day survive a host outage. It is built before the first real AWS deploy, against this same API. Until then, local testing uses the Docker database, which is the stand-in for RDS.

## Privacy

Every query is scoped to the signed-in doctor. The later news job is a separate fetch of public articles. It is not given patient names, conditions, addresses, or landmarks.

## Build order

1. Local PostgreSQL, login, new patient, and the calculated chart (`N + 0`).
2. Close a day, including whole-day doctor leave, so the chart becomes `N + n`.
3. Month calendar and the patient list.
4. Extend, money, and the backup file.
5. On-device copy and the installable app shell, then the AWS paid deploy.
6. Field updates from PubMed and RSS, in their own storage, after the visit record is in daily use.
