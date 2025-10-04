import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, resendVerificationEmail } from "../api/manApi";

import GoogleOAuthButton from "../components/GoogleOAuthButton";
import ReCAPTCHA from "react-google-recaptcha";
import { scheduleLogoutAtJwtExp } from "../util/authUtils";
import { useUser } from "../login/useUser";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { setUser } = useUser();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA | null>(null);

  const [showResend, setShowResend] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const [resendCaptcha, setResendCaptcha] = useState("");

  const handleLogin = async () => {
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }

    if (!captchaToken) {
      setError("Please complete the CAPTCHA.");
      return;
    }

    setSubmitting(true);

    try {
      const data = await login({
        username,
        password,
        captcha_token: captchaToken,
      });
      setUser(data.user);
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      scheduleLogoutAtJwtExp(setUser, data.access_token);
      setError(null);
      navigate("/");
    } catch (err) {
      const msg = (err as Error).message || "";
      console.error("Login error:", msg);

      const [statusCode, ...rest] = msg.split(":");
      const detail = rest.join(":").trim();

      if (statusCode === "403" && detail === "Email not verified") {
        setError("Email not verified. Please check your inbox or spam folder.");
        setShowResend(true);
      } else if (statusCode === "401" && detail === "Invalid credentials") {
        setError("Invalid username or password.");
      } else if (
        // common server phrases; adjust to your backend’s wording if needed
        /captcha/i.test(detail) ||
        /token/i.test(detail) ||
        statusCode === "400"
      ) {
        setError("CAPTCHA expired. Please try again.");
      } else {
        setError("Login failed. Please try again.");
      }
      setCaptchaToken("");
      recaptchaRef.current?.reset();
    } finally {
      setSubmitting(false);
    }
  };

  const triggerResend = async () => {
    setResendMsg(null);
    setResending(true);
    try {
      const { message } = await resendVerificationEmail({
        // Prefer email; fallback to username if you want
        email: resendEmail || undefined,
        username: !resendEmail ? username : undefined,
        captcha_token: resendCaptcha || undefined,
      });
      setResendMsg(message || "If an account exists, a new link was sent.");
    } catch (err) {
      console.error("Resend error:", (err as Error).message || err);
      setResendMsg("If an account exists, a new link was sent.");
    } finally {
      setResending(false);
      setResendCaptcha("");
      recaptchaRef.current?.reset();
    }
  };

  return (
    <div className="flex-grow bg-gray-100 flex items-center justify-center min-h-[calc(100vh-100px)] px-4">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 mb-4 border rounded bg-blue-50"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-6 border rounded bg-blue-50"
        />
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
          onChange={(token) => setCaptchaToken(token || "")}
          onExpired={() => {
            setCaptchaToken("");
            setError("CAPTCHA expired. Please try again.");
          }}
          onError={() => {
            setCaptchaToken("");
            setError("CAPTCHA failed to load. Please retry.");
          }}
          className="mb-4"
        />

        <button
          onClick={handleLogin}
          disabled={submitting} // ⬅️ remove `|| !captchaToken`
          className={`w-full text-white py-2 rounded ${
            submitting
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600/70 hover:bg-blue-600"
          }`}
        >
          {submitting ? "Signing in..." : "Login"}
        </button>

        {showResend && (
          <div className="mt-6 p-4 border rounded bg-yellow-50">
            <p className="text-sm mb-2 font-medium">
              Your verification link may have expired. Enter your email to
              resend:
            </p>
            <input
              type="email"
              placeholder="Email used at signup (preferred)"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              className="w-full p-2 mb-3 border rounded bg-white"
            />
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
              onChange={(t) => setResendCaptcha(t || "")}
              className="mb-3"
            />
            <button
              onClick={triggerResend}
              disabled={resending}
              className={`w-full text-white py-2 rounded ${
                resending
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600/70 hover:bg-blue-600"
              }`}
            >
              {resending ? "Resending..." : "Resend verification email"}
            </button>
            {resendMsg && (
              <p className="mt-3 text-center text-sm text-gray-700">
                {resendMsg}
              </p>
            )}
          </div>
        )}

        <div className="my-4">
          <GoogleOAuthButton />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
