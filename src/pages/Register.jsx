import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      await register(fullName, email, password);
      navigate("/login");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Registration failed.");
    }
  }

  return (
    <form className="mx-auto mt-[10vh] w-full max-w-md rounded-xl bg-card p-8 ring-1 ring-line" onSubmit={onSubmit}>
      <div className="mb-6 flex items-center gap-2 font-bold text-emerald-400">
        <Shield size={22} /> Secure Cloud
      </div>
      <h1 className="mb-6 text-2xl font-semibold">Create account</h1>
      <label className="mb-4 block text-sm">Full name
        <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </label>
      <label className="mb-4 block text-sm">Email
        <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label className="mb-4 block text-sm">Password
        <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
      </label>
      {error && <p className="mb-4 text-sm text-rose-300">{error}</p>}
      <button className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-emerald-400" type="submit">Register</button>
      <p className="mt-4 text-sm text-muted">Already registered? <Link className="text-emerald-300 hover:underline" to="/login">Sign in</Link></p>
    </form>
  );
}