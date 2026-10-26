import { useState, type ChangeEvent } from "react";
import { api, ApiError, type Doctor } from "../api";

export function AccountPage({ doctor }: { doctor: Doctor }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function download() {
    setError("");
    try {
      const backup = await api<unknown>("/backup");
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "visitwise-backup.json";
      link.click();
      URL.revokeObjectURL(url);
      setMessage("Backup downloaded.");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not download the backup.");
    }
  }

  async function restore(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!window.confirm("Replace the patients on this account with the file?")) return;
    setError("");
    setMessage("");
    try {
      const text = await file.text();
      const restored = await api<{ patients: number }>("/backup", {
        method: "POST",
        body: text,
      });
      setMessage(`Restored ${restored.patients} patients.`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not restore the backup.");
    }
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-2 md:py-8">
      <h1 className="font-serif text-4xl">{doctor.name}</h1>
      <p className="mt-2 text-muted">{doctor.email}</p>
      <p className="mt-6 text-sm text-muted">
        The backup file is the copy you keep before moving this database to Amazon RDS.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button className="h-11 rounded-xl bg-ink px-4 text-paper" onClick={download}>
          Download backup
        </button>
        <label className="flex h-11 cursor-pointer items-center rounded-xl border border-line bg-card px-4">
          Restore backup
          <input className="hidden" type="file" accept="application/json" onChange={restore} />
        </label>
      </div>
      {message ? <p className="mt-4 text-sm text-pine">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
    </main>
  );
}
