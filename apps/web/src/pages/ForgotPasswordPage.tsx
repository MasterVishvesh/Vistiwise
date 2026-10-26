import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError } from "../api";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [resetPath, setResetPath] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    setChecked(false);
    try {
      const result = await api<{ resetPath: string | null }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setResetPath(result.resetPath);
      setChecked(true);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not start the reset.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <p className="text-sm uppercase tracking-[0.16em] text-muted">Visitwise</p>
      <h1 className="mt-2 font-serif text-5xl leading-none">Forgot password</h1>
      <p className="mt-3 text-muted">
        Enter the email on the account. The link lasts 30 minutes. This computer shows it here
        because email sending starts with the AWS plan.
      </p>
      <form className="mt-8 flex flex-col gap-4" onSubmit={submit}>
        <label className="block text-sm">
          <span className="text-muted">Email</span>
          <input
            className="mt-1 h-12 w-full rounded-xl border border-line bg-card px-3"
            type="email"
            value={email}
            required
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button className="h-12 rounded-xl bg-ink text-paper disabled:opacity-60" disabled={pending}>
          {pending ? "Checking…" : "Continue"}
        </button>
      </form>
      {checked && resetPath ? (
        <button
          className="mt-6 h-12 rounded-xl bg-pine text-paper"
          onClick={() => navigate(resetPath)}
        >
          Set a new password
        </button>
      ) : null}
      {checked && !resetPath ? (
        <p className="mt-6 text-sm text-muted">No account uses that email.</p>
      ) : null}
      <Link className="mt-6 text-sm text-pine" to="/login">
        Back to sign in
      </Link>
    </main>
  );
}
