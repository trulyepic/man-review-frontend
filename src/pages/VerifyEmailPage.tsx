import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { resendVerificationEmail, verifyEmail } from "../api/manApi";
import ReCAPTCHA from "react-google-recaptcha";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [resendCaptcha, setResendCaptcha] = useState("");
  const recaptchaRef = useRef<ReCAPTCHA | null>(null);

  const handleResend = async () => {
    setResending(true);
    setResendMsg(null);
    try {
      const { message } = await resendVerificationEmail({
        email: email || undefined,
        captcha_token: resendCaptcha || undefined,
      });
      setResendMsg(message || "If an account exists, a new link was sent.");
    } catch {
      setResendMsg("If an account exists, a new link was sent.");
    } finally {
      setResending(false);
      setResendCaptcha("");
      recaptchaRef.current?.reset();
    }
  };

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    verifyEmail(token)
      .then((msg) => {
        setStatus("success");
        setMessage(msg || "Email verified successfully!");
        setTimeout(() => navigate("/login"), 3000);
      })
      .catch((err) => {
        setStatus("error");
        if (err.message.includes("expired")) {
          setMessage("Verification link expired. Please request a new one.");
        } else {
          setMessage("Invalid or already-used token.");
        }
      });
  }, []);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 px-4">
      <div className="bg-white p-6 rounded shadow-md max-w-md w-full text-center">
        {status === "verifying" && (
          <p className="text-blue-600 text-lg">Verifying your email...</p>
        )}
        {status === "success" && (
          <p className="text-green-600 text-lg">
            ✅ {message} <br /> Redirecting to login...
          </p>
        )}
        {status === "error" && (
          <p className="text-red-600 text-lg">❌ {message}</p>
        )}
      </div>

      {status === "error" && /expired/i.test(message) && (
        <div className="mt-4 text-left">
          <label className="block text-sm mb-2">
            Enter your email to resend:
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 mb-3 border rounded"
            placeholder="you@example.com"
          />
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
            onChange={(t) => setResendCaptcha(t || "")}
            className="mb-3"
          />
          <button
            onClick={handleResend}
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
    </div>
  );
};

export default VerifyEmailPage;
