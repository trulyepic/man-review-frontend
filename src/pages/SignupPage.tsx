import { useState } from "react";
import { signup } from "../api/manApi";
import { useNavigate } from "react-router-dom";
// import { useUser } from "../login/UserContext";
import GoogleOAuthButton from "../components/GoogleOAuthButton";
import ReCAPTCHA from "react-google-recaptcha";

const SignupPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  // const { setUser } = useUser();
  const navigate = useNavigate();
  const [captchaToken, setCaptchaToken] = useState("");

  const handleSignup = async () => {
    if (!username.trim() || !password.trim() || !email.trim()) {
      alert("All fields are required.");
      return;
    }

    if (!captchaToken) {
      alert("Please complete the CAPTCHA.");
      return;
    }

    try {
      await signup({ username, password, email, captcha_token: captchaToken });

      alert("Signup successful! Please verify your email.");
      navigate("/check-your-email");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      if (message.includes("409")) {
        alert("Username already exists. Try a different one.");
      } else if (message.includes("422")) {
        alert("Invalid email. Only Gmail or Yahoo addresses are allowed.");
      } else {
        alert("Signup failed");
      }
      console.error("Signup error:", err);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />
        <input
          type="email"
          placeholder="Email (Gmail or Yahoo only)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-6 border rounded"
        />

        <ReCAPTCHA
          sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
          onChange={(token) => setCaptchaToken(token || "")}
          className="mb-6"
        />

        <button
          onClick={handleSignup}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Sign Up
        </button>
        <div className="my-4 text-center text-sm text-gray-500"></div>

        <GoogleOAuthButton />
      </div>
    </div>
  );
};

export default SignupPage;
