import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MailCheck } from "lucide-react"; // optional icon, make sure lucide-react is installed

const CheckYourEmailPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 10000); // auto redirect in 10 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 px-4">
      <div className="bg-white p-8 rounded shadow-md max-w-md w-full text-center">
        <MailCheck size={48} className="text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-gray-800">
          Check Your Email
        </h2>
        <p className="text-gray-700 mb-3">
          We've sent a verification link to your email address.
        </p>
        <p className="text-sm text-gray-600 mb-6">
          If you don’t see it in your inbox, be sure to check your{" "}
          <strong>Spam</strong> or <strong>Promotions</strong> folder.
        </p>
        <p className="text-xs text-gray-400">
          Redirecting to login in 10 seconds...
        </p>
      </div>
    </div>
  );
};

export default CheckYourEmailPage;
