import { Link } from "react-router-dom";

const previewDays = [
  { date: "20", tone: "empty" },
  { date: "21", tone: "done" },
  { date: "22", tone: "done" },
  { date: "23", tone: "leave" },
  { date: "24", tone: "open" },
  { date: "25", tone: "open" },
  { date: "26", tone: "empty" },
];

const toneClass: Record<string, string> = {
  done: "bg-pine text-paper",
  leave: "bg-clay text-paper",
  open: "border border-line bg-card text-ink",
  empty: "text-muted",
};

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <p className="font-serif text-2xl">Visitwise</p>
        <div className="flex items-center gap-2">
          <Link className="rounded-lg px-3 py-2 text-sm" to="/login">
            Sign in
          </Link>
          <Link className="rounded-lg bg-ink px-3 py-2 text-sm text-paper" to="/login?mode=register">
            Create account
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-16">
        <section className="grid items-center gap-10 py-8 md:grid-cols-[1.1fr_0.9fr] md:py-14">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-pine">For one physiotherapist</p>
            <h1 className="mt-3 max-w-xl font-serif text-5xl leading-[1.05] md:text-6xl">
              The day, the course, and the fee.
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted">
              See who is planned today. Mark a visit done, or name the leave. The rest of the course moves with it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="inline-flex h-12 items-center rounded-xl bg-ink px-5 text-paper" to="/login?mode=register">
                Create account
              </Link>
              <Link className="inline-flex h-12 items-center rounded-xl border border-line bg-card px-5" to="/login">
                Sign in
              </Link>
            </div>
          </div>
          <Preview />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-line bg-card p-5">
            <h2 className="font-serif text-2xl">Today</h2>
            <p className="mt-2 text-sm text-muted">
              Clinic, hospital, and home visits for the date, in time order. Mark them done, or record leave.
            </p>
          </article>
          <article className="rounded-2xl border border-line bg-card p-5">
            <h2 className="font-serif text-2xl">The course</h2>
            <p className="mt-2 text-sm text-muted">
              Each patient has a calendar. Green is a treatment already done. Brown is leave. A missed day shifts forward.
            </p>
          </article>
          <article className="rounded-2xl border border-line bg-card p-5">
            <h2 className="font-serif text-2xl">The month</h2>
            <p className="mt-2 text-sm text-muted">
              A calendar of the whole practice, and the fees that belong to that month.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}

function Preview() {
  return (
    <div className="rounded-3xl border border-line bg-card p-5 shadow-[0_24px_50px_-28px_rgba(28,25,21,0.55)]">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted">Thu 23 Oct</p>
          <p className="font-serif text-3xl">2 still open</p>
        </div>
        <p className="text-sm text-pine">Today</p>
      </div>
      <div className="mt-5 space-y-2">
        <Row place="Clinic · 4:00 pm" mark="Done" markClass="bg-pine text-paper" />
        <Row place="Clinic · 5:00 pm" mark="Leave" markClass="bg-clay text-paper" />
        <Row place="Home · 10:00 am" mark="Open" markClass="border border-line text-ink" />
      </div>
      <div className="mt-5 grid grid-cols-7 gap-1.5">
        {previewDays.map((day) => (
          <div
            key={day.date}
            className={`flex h-10 items-center justify-center rounded-lg text-sm ${toneClass[day.tone]}`}
          >
            {day.date}
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ place, mark, markClass }: { place: string; mark: string; markClass: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-paper px-3 py-2">
      <p className="text-sm">{place}</p>
      <span className={`rounded-lg px-2 py-1 text-xs ${markClass}`}>{mark}</span>
    </div>
  );
}
