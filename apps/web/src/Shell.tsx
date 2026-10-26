import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { api, type Doctor } from "./api";

const tabs = [
  { to: "/", label: "Today", end: true },
  { to: "/month", label: "Month", end: false },
  { to: "/patients", label: "Patients", end: false },
  { to: "/money", label: "Money", end: false },
];

export function Shell({
  doctor,
  onSignedOut,
}: {
  doctor: Doctor;
  onSignedOut: () => void;
}) {
  const navigate = useNavigate();

  async function signOut() {
    await api("/auth/logout", { method: "POST" });
    onSignedOut();
    navigate("/");
  }

  return (
    <div className="md:grid md:grid-cols-[220px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col self-start overflow-hidden border-r border-line bg-card px-4 py-6 md:flex">
        <p className="px-3 font-serif text-2xl">Visitwise</p>
        <nav className="mt-8 flex flex-col gap-1">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm ${isActive ? "bg-ink text-paper" : "text-ink hover:bg-paper"}`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
        <button className="mt-auto px-3 py-2 text-left text-sm text-muted" onClick={() => navigate("/account")}>
          {doctor.name}
        </button>
        <button className="px-3 py-2 text-left text-sm text-muted" onClick={signOut}>
          Sign out
        </button>
      </aside>
      <div className="pb-32 md:pb-0">
        <header className="flex items-center justify-between gap-3 px-5 py-4 max-[375px]:px-3 md:hidden">
          <p className="shrink-0 rounded-lg bg-ink px-2.5 py-1 font-serif text-xl leading-none text-paper">Visitwise</p>
          <button className="truncate text-right text-sm text-muted" onClick={() => navigate("/account")}>
            {doctor.name}
          </button>
        </header>
        <Outlet />
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card md:hidden">
        <div className="relative grid grid-cols-[1fr_1fr_4.25rem_1fr_1fr] items-center px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] min-[376px]:grid-cols-[1fr_1fr_4.75rem_1fr_1fr]">
          {tabs.slice(0, 2).map((tab) => (
            <MobileTab key={tab.to} tab={tab} />
          ))}
          <Link
            to="/patients/new"
            aria-label="New patient"
            className="relative flex h-full flex-col items-center justify-end pb-0.5 text-ink"
          >
            <span className="absolute top-0 left-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-[70%] items-center justify-center rounded-full border-4 border-card bg-ink text-paper shadow-[0_8px_18px_-8px_rgba(28,25,21,0.55)] min-[376px]:h-14 min-[376px]:w-14">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            <span className="block w-full text-center text-[10px] leading-tight">
              New
              <br />
              patient
            </span>
          </Link>
          {tabs.slice(2).map((tab) => (
            <MobileTab key={tab.to} tab={tab} />
          ))}
        </div>
      </nav>
    </div>
  );
}

function MobileTab({ tab }: { tab: (typeof tabs)[number] }) {
  return (
    <NavLink
      to={tab.to}
      end={tab.end}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 py-1 text-[9px] min-[376px]:text-[10px] ${isActive ? "text-ink" : "text-muted"}`
      }
    >
      <TabIcon name={tab.label} />
      {tab.label}
    </NavLink>
  );
}

function TabIcon({ name }: { name: string }) {
  const props = {
    className: "h-5 w-5",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
  };
  if (name === "Today") {
    return (
      <svg {...props}>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    );
  }
  if (name === "Month") {
    return (
      <svg {...props}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  }
  if (name === "Patients") {
    return (
      <svg {...props}>
        <circle cx="12" cy="8" r="3" />
        <path d="M5 19c1.5-3 3.8-4.5 7-4.5S17.5 16 19 19" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5v9M9.5 9.5c.6-1 1.5-1.5 2.5-1.5 1.4 0 2.4.8 2.4 2s-1 1.8-2.4 2-2.4.9-2.4 2 1 2 2.4 2c1 0 1.9-.5 2.5-1.4" />
    </svg>
  );
}
