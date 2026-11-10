import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ShieldLoader from "./components/ShieldLoader";
import { useAuth } from "./context/AuthContext";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import Files from "./pages/Files";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Security from "./pages/Security";
import FileDetails from "./pages/FileDetails";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <ShieldLoader label="Securing your session…" fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/files" element={<Files />} />
        <Route path="/security" element={<Security />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/files/:fileId" element={<FileDetails />} />
      </Route>
    </Routes>
  );
}