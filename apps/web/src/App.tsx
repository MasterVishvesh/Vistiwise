import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { api, type Doctor } from "./api";
import { Shell } from "./Shell";
import { AccountPage } from "./pages/AccountPage";
import { ChartPage } from "./pages/ChartPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { MoneyPage } from "./pages/MoneyPage";
import { MonthPage } from "./pages/MonthPage";
import { NewPatientPage } from "./pages/NewPatientPage";
import { PatientsPage } from "./pages/PatientsPage";
import { TodayPage } from "./pages/TodayPage";

export function App() {
  const [doctor, setDoctor] = useState<Doctor | null | undefined>(undefined);

  useEffect(() => {
    api<Doctor>("/auth/me")
      .then(setDoctor)
      .catch(() => setDoctor(null));
  }, []);

  if (doctor === undefined) {
    return <p className="px-6 py-10 text-muted">Opening Visitwise…</p>;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onSignedIn={setDoctor} />} />
      <Route path="/forgot" element={<ForgotPasswordPage />} />
      <Route path="/reset" element={<ResetPasswordPage onSignedIn={setDoctor} />} />
      <Route element={doctor ? <Shell doctor={doctor} onSignedOut={() => setDoctor(null)} /> : <PublicGate />}>
        <Route index element={<TodayPage />} />
        <Route path="month" element={<MonthPage />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="patients/new" element={<NewPatientPage />} />
        <Route path="patients/:id" element={<ChartPage />} />
        <Route path="money" element={<MoneyPage />} />
        <Route
          path="account"
          element={doctor ? <AccountPage doctor={doctor} /> : <Navigate to="/login" replace />}
        />
      </Route>
      <Route path="*" element={<Missing />} />
    </Routes>
  );
}

function PublicGate() {
  const location = useLocation();
  if (location.pathname !== "/") return <Navigate to="/" replace />;
  return <LandingPage />;
}

function Missing() {
  const navigate = useNavigate();
  return (
    <main className="mx-auto max-w-lg px-5 py-16">
      <h1 className="font-serif text-4xl">That page is not here.</h1>
      <button className="mt-6 text-pine" onClick={() => navigate("/")}>
        Back to today
      </button>
    </main>
  );
}
