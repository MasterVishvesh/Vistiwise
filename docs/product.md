# Product rules

Visitwise is for one physiotherapist who treats patients at a hospital, a clinic, or at home. The daily job is small: see who was planned today, mark them treated, and name the leave when someone was not treated.

## Entered once per patient

| Field | Rule |
| --- | --- |
| Patient id | Assigned by the app, unique for that doctor. Example: `P-0041`. |
| Name, age, gender | Required. Gender is male, female, or other. |
| Condition | A short label, picked from a short list or typed once. |
| Place | Hospital, clinic, or home visit, plus the place name. |
| Address or landmark | Home visits only. At least one of the two is required. The day list shows the landmark when it exists. |
| Time slot | The appointment time, such as `10:00`. It orders the day list. It is not a duration. |
| Fee | Either an amount per visit, or one package amount for the course. |
| Treatment days | The starting length of the course, such as 15. |
| Start date | The first calendar day of the chart. |

Hours worked are out of this version. There is no separate block of hospital time without a patient.

## End of the day

Today's list is every patient whose next open treatment falls on that date. The list is grouped by place and ordered by time slot.

- **Mark all done** records a treatment for everyone still open today.
- **Not done** asks, for that patient only, whether it was doctor leave or patient leave.
- **Doctor leave for everyone** writes doctor leave for every patient on today's list.
- **Government holiday** marks that date off for every patient. The treatment due that day moves to the next working day and the chart counts the holiday in **+ n**. A visit already marked done stays done.

A done day counts as one treatment and, for a per-visit fee, adds that fee. A leave day counts as neither a treatment nor a fee.

The doctor can change today's result later the same day. Changing an older day is allowed. The chart is rebuilt from the start date, so the rest of the course moves with that change.

## How leave moves the course

Treatment days are consecutive calendar dates. A leave stays on the date it happened. The treatment that was due that day moves to the next calendar day, and every later treatment follows.

Example: a 15-day course starts on Monday. Monday is patient leave.

- Monday is a leave box.
- Tuesday becomes treatment 1.
- The fifteenth treatment falls one day later.
- The chart label is **15 + 1**.

Doctor leave and patient leave both add to the extra days. Two leave days, one from each side, read as **15 + 2**.

## Closing a course

A course stays on Today for every remaining treatment day until those days are marked or the course ends. **Close patient** is for someone who stops treatment. The doctor picks the last day, usually today. Visits already marked stay on the chart and in the money. The close date and every later day leave Today and the calendar. **Reopen** puts the remaining days back.

## More treatment days

**Extend** adds treatment days onto the same patient. Extending 15 by 3 makes the target 18. Existing leave days stay in the label, so the chart reads **18 + n**. The new days are placed after the current last day. The time slot and the place stay the same.

If the fee is a package, the doctor can type an extra amount at the same time. That amount is added to the package. A per-visit fee stays the amount already on the patient.

## Money

- A done day stores the per-visit amount that applied that day.
- A leave day stores no fee.
- A package amount is stored on the patient and counted once.
- An extension amount is added to that package.
- Closed days keep the fee that was saved with them.

## Month calendar

| Colour | Meaning |
| --- | --- |
| Worked | At least one patient was marked done that date. |
| Leave | Every closed result that date is a leave. |
| Upcoming | A treatment still falls on that date and the day is not closed. |
| Empty | No patient's chart has a box on that date. |

## Field updates, later

A later module can show titles, short summaries, and links about physiotherapy news, equipment, and techniques. Sources are the PubMed API and RSS feeds. That job never receives patient names, conditions, or addresses.
