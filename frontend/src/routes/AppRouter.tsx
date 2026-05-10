import { Navigate, Route, Routes } from "react-router-dom";
import { AuthLayout } from "../layouts/AuthLayout";
import { AppLayout } from "../layouts/AppLayout";
import { DemoLayout } from "../layouts/DemoLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { DashboardPage } from "../pages/DashboardPage";
import { AthletesPage } from "../pages/AthletesPage";
import { AthleteProfilePage } from "../pages/AthleteProfilePage";
import { AlertsPage } from "../pages/AlertsPage";
import { MatchesPage } from "../pages/matches/MatchesPage";
import { MatchIntelligencePage } from "../pages/MatchIntelligencePage";
import { ScoutPage } from "../pages/scout/ScoutPage";
import { SettingsPage } from "../pages/settings/SettingsPage";
import { HomePage } from "../pages/HomePage";
import { DemoDashboardPage } from "../pages/demo/DemoDashboardPage";
import { DemoAthletesPage } from "../pages/demo/DemoAthletesPage";
import { DemoAthleteDetailPage } from "../pages/demo/DemoAthleteDetailPage";
import { DemoAlertsPage } from "../pages/demo/DemoAlertsPage";
import { DemoMatchIntelligencePage } from "../pages/demo/DemoMatchIntelligencePage";

export const AppRouter = () => (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route element={<AuthLayout />}>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Route>

    <Route element={<ProtectedRoute />}>
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/athletes" element={<AthletesPage />} />
        <Route path="/athletes/:athleteId" element={<AthleteProfilePage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/match-intelligence" element={<MatchIntelligencePage />} />
        <Route path="/scout" element={<ScoutPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Route>

    <Route element={<DemoLayout />}>
      <Route path="/demo/dashboard" element={<DemoDashboardPage />} />
      <Route path="/demo/athletes" element={<DemoAthletesPage />} />
      <Route path="/demo/athletes/:athleteId" element={<DemoAthleteDetailPage />} />
      <Route path="/demo/alerts" element={<DemoAlertsPage />} />
      <Route path="/demo/match-intelligence" element={<DemoMatchIntelligencePage />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
