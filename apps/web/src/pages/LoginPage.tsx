import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, ApiError, type Doctor } from "../api";

export function LoginPage({ onSignedIn }: { onSignedIn: (doctor: Doctor) => void }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">(params.get("mode") === "register" ? "register" : "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const doctor = await api<Doctor>(mode === "login" ? "/auth/login" : "/auth/register", {
        method: "POST",
        body: JSON.stringify(
          mode === "login" ? { email, password } : { name, email, password },
        ),
      });
      onSignedIn(doctor);
      navigate("/");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not sign in.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <button type="button" className="text-left text-sm uppercase tracking-[0.16em] text-muted" onClick={() => navigate("/")}>
        Visitwise
      </button>
      <h1 className="mt-2 font-serif text-5xl leading-none">
        {mode === "login" ? "Sign in" : "Create the account"}
      </h1>
      <p className="mt-3 text-muted">
        One account for this computer. The same login moves to AWS with the paid plan.
      </p>
      <form className="mt-8 flex flex-col gap-4" onSubmit={submit}>
        {mode === "register" ? (
          <Field label="Your name" value={name} onChange={setName} />
        ) : null}
        <Field label="Email" type="email" value={email} onChange={setEmail} />
        <Field label="Password" type="password" value={password} onChange={setPassword} />
        {mode === "login" ? (
          <button type="button" className="text-left text-sm text-pine" onClick={() => navigate("/forgot")}>
            Forgot password?
          </button>
        ) : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button
          className="mt-2 h-12 rounded-xl bg-ink text-paper disabled:opacity-60"
          disabled={pending}
        >
          {pending ? "Saving…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>
      <button
        className="mt-6 text-left text-sm text-pine"
        onClick={() => setMode(mode === "login" ? "register" : "login")}
      >
        {mode === "login" ? "Create an account" : "I already have an account"}
      </button>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  const fieldId = label.toLowerCase().replaceAll(" ", "-");

  return (
    <div className="text-sm">
      <label className="text-muted" htmlFor={fieldId}>
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={fieldId}
          className={`h-12 w-full rounded-xl border border-line bg-card px-3 ${isPassword ? "pr-16" : ""}`}
          type={isPassword && visible ? "text" : type}
          value={value}
          required
          minLength={isPassword ? 8 : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
        {isPassword ? (
          <button
            type="button"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-pine"
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            onClick={() => setVisible((current) => !current)}
          >
            {visible ? "Hide" : "Show"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
