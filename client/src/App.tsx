import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import {
  useEffect,
  useState,
  createContext,
  useContext,
  type JSX,
} from "react";
import LoginPage from "./pages/Login";
import Home from "./pages/Home";
import Loader from "./components/Loader";

type UserType = {
  id: string;
  tag: string;
  allowed: boolean;
  avatar?: string;
} | null;

type AuthContextType = {
  user: UserType;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<UserType>>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType>(null);
  const [loading, setLoading] = useState(true);
  const apiBase =
    import.meta.env.VITE_API_URL || "https://api.data.synnabot.azaken.com";

  useEffect(() => {
    fetch(`${apiBase}/auth/me`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setUser(data.user);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div>
        <Loader />
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
