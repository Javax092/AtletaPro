import { Navigate, Route, Routes } from "react-router-dom";
import { AuthLayout } from "../layouts/AuthLayout";
import { AppLayout } from "../layouts/AppLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { AthletesPage } from "../pages/athletes/AthletesPage";
import { MatchesPage } from "../pages/matches/MatchesPage";
import { MatchIntelligencePage } from "../pages/match-intelligence/MatchIntelligencePage";
import { ScoutPage } from "../pages/scout/ScoutPage";
import { SettingsPage } from "../pages/settings/SettingsPage";
import { HomePage } from "../pages/HomePage";

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
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/match-intelligence" element={<MatchIntelligencePage />} />
        <Route path="/scout" element={<ScoutPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
