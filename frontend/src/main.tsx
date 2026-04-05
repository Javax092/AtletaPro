import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "./routes/AppRouter";
import { AuthProvider } from "./hooks/useAuth";
import { NotificationsProvider } from "./hooks/useNotifications";
import { OnboardingProvider } from "./hooks/useOnboarding";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NotificationsProvider>
          <OnboardingProvider>
            <AppRouter />
          </OnboardingProvider>
        </NotificationsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
