import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { verifyEmail } from "../api/manApi";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

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
    </div>
  );
};

export default VerifyEmailPage;
