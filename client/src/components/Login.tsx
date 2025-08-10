import { useAuth } from "../App";
import { useSearchParams, useNavigate } from "react-router-dom";
import Loader from "./Loader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import {
  faSignOutAlt as faSignOut,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import logo from "../assets/icon.png";

export default function LoginPage() {
  const { user, loading, setUser } = useAuth();
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const [params] = useSearchParams();
  const error = params.get("error");
  const authDenied = params.get("auth") === "denied";
  const navigate = useNavigate();

  const login = () => {
    window.location.href = `${apiBase}/auth/discord`;
  };

  const logout = () => {
    fetch(`${apiBase}/auth/logout`, {
      method: "POST",
      credentials: "include",
    })
      .then(() => setUser(null))
      .catch(console.error);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader />
      </div>
    );

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center px-4">
      <div className="bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-sm flex flex-col items-center gap-4">
        {error && <p className="text-red-400 text-center">Error: {error}</p>}
        {authDenied && (
          <p className="text-red-400 text-center">
            You do not have permission to access this site.
          </p>
        )}

        {!user ? (
          <>
            <h1 className="text-xl font-semibold text-gray-200">
              Sign in with Discord
            </h1>
            <img src={logo} alt="Logo" />
            <button
              onClick={login}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition"
            >
              <FontAwesomeIcon icon={faDiscord} className="text-indigo-400" />
              <span className="text-gray-200">Login</span>
            </button>
          </>
        ) : (
          <>
            <img
              src={user.avatar}
              alt="Profile"
              className="w-24 h-24 rounded-full border-2 border-gray-600 hover:border-indigo-400 transition"
            />
            <div className="flex flex-col gap-2 w-full mt-4">
              <button
                onClick={() => navigate("/")}
                className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition"
              >
                <FontAwesomeIcon
                  icon={faArrowRight}
                  className="text-green-400"
                />
                <span className="text-gray-200">Continue to Dashboard</span>
              </button>
              <button
                onClick={logout}
                className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition"
              >
                <FontAwesomeIcon icon={faSignOut} className="text-red-400" />
                <span className="text-gray-200">Logout</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
