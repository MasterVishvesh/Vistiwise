# Screens

The phone is the primary layout. The laptop uses the same screens with a side navigation rail instead of a bottom bar. The doctor can do the whole end-of-day job with one hand.

Four tabs: **Today**, **Month**, **Patients**, **Money**. The doctor name in the header opens **Account**. New patient and a patient's chart are pages opened from Patients.

Sample people used on the wireframes:

| Id | Name | Age | Place | Slot |
| --- | --- | --- | --- | --- |
| P-0041 | Ravi Shah | 54 | Home, blue gate near City Mall | 10:00 |
| P-0042 | Meera Joshi | 46 | City Clinic | 11:00 |
| P-0043 | Arun Patel | 61 | City Hospital | 12:30 |

## Today

This is the home screen.

- Header: the date, then a count such as "3 on the list".
- Primary button: **Mark all done**.
- Secondary button: **Doctor leave for everyone**.
- Patients grouped by place. Inside a place, rows follow the time slot.
- Each row shows the slot, the name, the age, the gender, the condition, and, for a home visit, the landmark.
- A row that is still open has **Not done**. Choosing it reveals two actions: **Doctor leave** and **Patient leave**.
- A closed row shows Done, Doctor leave, or Patient leave. Tapping it again changes that result.

Mark all done fills every still-open row. It leaves rows that were already set to a leave as they are.

## Month

- A month grid, with the previous and next month.
- Each date uses one colour from the product rules: worked, leave, upcoming, or empty.
- The count of done visits can sit on a worked date.
- Tapping a date opens that date in the Today layout, so a past day can be corrected. Saving rebuilds the affected charts.

## Patients

- Search by name or patient id.
- Each row shows the id, the name, treatments done out of the target (for example 8 of 15), and the next open date.
- **New patient** opens the form.

## New patient

One page, four groups, saved once.

1. **Person.** Name, age, gender. The id appears after save.
2. **Place.** Hospital, clinic, or home. Hospital and clinic ask for the place name. Home asks for an address and a landmark, and requires at least one.
3. **Plan.** Condition, start date, number of treatment days, time slot.
4. **Fee.** Per visit, or package. One amount field.

Save returns to that patient's chart, which shows `N + 0` boxes from the start date.

## Patient chart

- Back to the list, then the name and the id.
- The large figure is the label, such as **15 + 1**.
- Under it: treatments done, for example "1 of 15 treatments".
- A line of facts: age, gender, condition, place, landmark or address, time slot, and fee.
- The boxes wrap across the width. A treatment box reads like "Tue 13 · T1". A leave box reads like "Mon 12 · leave" and names doctor or patient.
- **Extend** asks for the number of extra treatment days. When the fee is a package, it also asks for an extra amount, which may be zero.

## Money

- The month, with previous and next.
- One total.
- Under it, visit fees (the sum of done-day snapshots in that month) and packages (each package once, in the month of the patient's start date, plus any extension amount in the month it was added).
- A list of the patients who contributed, with the amount next to each name.

## Account

- Doctor name and email.
- **Download backup** saves the local JSON file.
- **Restore backup** replaces local records from a file the doctor chooses.
- A line for the last successful sync, or "Sync is off" when the shared copy is not connected.
- Sign in and sign out appear here once the sync Worker exists. The visit screens work before sign-in.

## Laptop

The left rail holds Today, Month, Patients, and Money. The open screen uses the remaining width. Today's rows become a table: slot, patient, place, landmark, result. The chart boxes stay wrapped. Forms stay a single column with a comfortable reading width.
