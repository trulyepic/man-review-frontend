import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/manApi";
import { useUser } from "../login/UserContext";
import GoogleOAuthButton from "../components/GoogleOAuthButton";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { setUser } = useUser();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }

    try {
      const data = await login({ username, password });
      setUser(data.user);
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/");
    } catch (err) {
      const msg = (err as Error).message || "";
      console.error("Login error:", msg);

      const [statusCode, ...rest] = msg.split(":");
      const detail = rest.join(":").trim();

      if (statusCode === "403" && detail === "Email not verified") {
        setError("Email not verified. Please check your inbox or spam folder.");
      } else if (statusCode === "401" && detail === "Invalid credentials") {
        setError("Invalid username or password.");
      } else {
        setError("Login failed. Please try again.");
      }
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
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600/70 text-white py-2 rounded hover:bg-blue-600"
        >
          Login
        </button>
        <div className="my-4">
          <GoogleOAuthButton />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
