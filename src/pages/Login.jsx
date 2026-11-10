import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("Invalid email or password.");
    }
  }

  return (
    <form className="mx-auto mt-[10vh] w-full max-w-md rounded-xl bg-card p-8 ring-1 ring-line" onSubmit={onSubmit}>
      <div className="mb-6 flex items-center gap-2 font-bold text-emerald-400">
        <Shield size={22} /> Secure Cloud
      </div>
      <h1 className="mb-6 text-2xl font-semibold">Sign in</h1>
      <label className="mb-4 block text-sm">Email
        <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label className="mb-4 block text-sm">Password
        <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      {error && <p className="mb-4 text-sm text-rose-300">{error}</p>}
      <button className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-emerald-400" type="submit">Sign in</button>
      <p className="mt-4 text-sm text-muted">No account? <Link className="text-emerald-300 hover:underline" to="/register">Create one</Link></p>
    </form>
  );
}