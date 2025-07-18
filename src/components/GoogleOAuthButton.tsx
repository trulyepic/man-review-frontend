import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useUser } from "../login/UserContext";
import { googleOAuthLogin } from "../api/manApi";
import type { CredentialResponse } from "@react-oauth/google";

const GoogleOAuthButton = () => {
  const navigate = useNavigate();
  const { setUser } = useUser();

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse
  ) => {
    if (!credentialResponse.credential) {
      alert("Missing Google token");
      return;
    }

    try {
      const token = credentialResponse.credential;
      const data = await googleOAuthLogin(token);
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      navigate("/");
    } catch (err) {
      alert("Google login failed");
      console.error("Google OAuth error:", err);
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleGoogleSuccess}
      onError={() => alert("Google Login Failed")}
    />
  );
};

export default GoogleOAuthButton;
