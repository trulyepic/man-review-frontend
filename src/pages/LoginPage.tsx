import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { login, resendVerificationEmail } from "../api/manApi";
import GoogleOAuthButton from "../components/GoogleOAuthButton";
import AuthShell from "../components/AuthShell";
import { scheduleLogoutAtJwtExp } from "../util/authUtils";
import { useUser } from "../login/useUser";

const fieldClass =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100";

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
    <AuthShell
      eyebrow="Welcome Back"
      title="Pick up where you left off."
      description="Sign in to manage reading lists, rate titles, and keep your forum activity tied to one account."
      accentLabel="Your account"
      accentTitle="One place for rankings, lists, and discussion."
      accentBody="Your votes, saved chapters, and community activity stay together so you can jump back in without friction."
      highlights={["Reading lists", "Series ratings", "Forum replies"]}
      footerPrompt="Need an account?"
      footerLinkLabel="Create one"
      footerLinkTo="/signup"
    >
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Login
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use your Toon Ranks credentials to continue.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Username</span>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={fieldClass}
            />
          </label>

          <label className="block">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-700">
                Password
              </span>
              <Link
                to="/signup"
                className="text-xs font-medium text-slate-500 transition hover:text-slate-700"
              >
                Need an account?
              </Link>
            </div>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
            />
          </label>
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-3">
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
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={submitting}
          className={`mt-5 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${
            submitting
              ? "cursor-not-allowed bg-blue-400"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {submitting ? "Signing in..." : "Login"}
        </button>

        {showResend && (
          <div className="mt-6 rounded-[26px] border border-amber-200 bg-amber-50/80 p-4 sm:p-5">
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-slate-900">
                Resend verification email
              </h3>
              <p className="text-sm leading-6 text-slate-600">
                If your verification link expired, enter the email used for
                signup and we’ll send another one.
              </p>
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                placeholder="Email used at signup"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                className={fieldClass}
              />
            </label>

            <div className="mt-4 overflow-x-auto rounded-2xl border border-amber-200 bg-white/80 px-3 py-3">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                onChange={(t) => setResendCaptcha(t || "")}
              />
            </div>

            <button
              onClick={triggerResend}
              disabled={resending}
              className={`mt-4 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${
                resending
                  ? "cursor-not-allowed bg-blue-400"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {resending ? "Resending..." : "Resend verification email"}
            </button>

            {resendMsg && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {resendMsg}
              </div>
            )}
          </div>
        )}

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Or continue with
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 px-4 py-4">
          <GoogleOAuthButton />
        </div>
      </div>
    </AuthShell>
  );
};

export default LoginPage;
