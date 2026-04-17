import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { UserProvider } from "./login/UserContext.tsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "./components/ThemeContext.tsx";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

type RecaptchaOptionsWindow = Window & {
  recaptchaOptions?: {
    enterprise?: boolean;
  };
};

(window as RecaptchaOptionsWindow).recaptchaOptions = {
  ...((window as RecaptchaOptionsWindow).recaptchaOptions ?? {}),
  enterprise: true,
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <ThemeProvider>
        <UserProvider>
          <App />
        </UserProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
