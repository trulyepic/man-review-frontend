import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/manApi";
import { useUser } from "../login/UserContext";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { setUser } = useUser();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const data = await login({ username, password });
      setUser(data.user); // sets context
      localStorage.setItem("token", data.access_token); // optional: move to login()
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/");
    } catch (err) {
      alert("Login failed");
      console.error("Login error:", err);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-6 border rounded"
        />
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600/70 text-white py-2 rounded hover:bg-blue-600"
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
