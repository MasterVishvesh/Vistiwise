import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, ApiError, type Doctor } from "../api";

export function ResetPasswordPage({ onSignedIn }: { onSignedIn: (doctor: Doctor) => void }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const doctor = await api<Doctor>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      onSignedIn(doctor);
      navigate("/");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not save the new password.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <p className="text-sm uppercase tracking-[0.16em] text-muted">Visitwise</p>
      <h1 className="mt-2 font-serif text-5xl leading-none">New password</h1>
      <p className="mt-3 text-muted">Choose a password of at least 8 characters. The old sessions are signed out.</p>
      {token ? (
        <form className="mt-8 flex flex-col gap-4" onSubmit={submit}>
          <PasswordField label="New password" value={password} onChange={setPassword} />
          <PasswordField label="Confirm password" value={confirm} onChange={setConfirm} />
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <button className="h-12 rounded-xl bg-ink text-paper disabled:opacity-60" disabled={pending}>
            {pending ? "Saving…" : "Save password"}
          </button>
        </form>
      ) : (
        <p className="mt-6 text-sm text-danger">This reset link is missing. Start again from forgot password.</p>
      )}
      <Link className="mt-6 text-sm text-pine" to="/login">
        Back to sign in
      </Link>
    </main>
  );
}

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  const fieldId = label.toLowerCase().replaceAll(" ", "-");

  return (
    <div className="text-sm">
      <label className="text-muted" htmlFor={fieldId}>
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={fieldId}
          className="h-12 w-full rounded-xl border border-line bg-card px-3 pr-16"
          type={visible ? "text" : "password"}
          value={value}
          required
          minLength={8}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-pine"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}
