import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import AuthSubmitButton from "../components/AuthSubmitButton";
import { useAuth } from "../context/AuthContext";
import { useSlowFlag } from "../utils/useSlowFlag";

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none disabled:opacity-60";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const slow = useSlowFlag(submitting);

  async function onSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(
        err.response
          ? "Invalid email or password."
          : "Could not reach the server. Please check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="mx-auto mt-[10vh] w-full max-w-md rounded-xl bg-card p-8 ring-1 ring-line" onSubmit={onSubmit}>
      <div className="mb-6 flex items-center gap-2 font-bold text-emerald-400">
        <Shield size={22} className={submitting ? "animate-pulse motion-reduce:animate-none" : ""} /> Secure Cloud
      </div>
      <h1 className="mb-6 text-2xl font-semibold">Sign in</h1>
      <fieldset disabled={submitting} className="min-w-0">
        <label className="mb-4 block text-sm">Email
          <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="mb-4 block text-sm">Password
          <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="mb-4 text-sm text-rose-300" role="alert">{error}</p>}
        <AuthSubmitButton loading={submitting} label="Sign in" loadingLabel="Signing in…" />
      </fieldset>
      {slow && (
        <p className="mt-3 text-xs text-muted" role="status">
          Still working… the server may be waking up, so the first sign-in can take up to a minute.
        </p>
      )}
      <p className="mt-4 text-sm text-muted">No account? <Link className="text-emerald-300 hover:underline" to="/register">Create one</Link></p>
    </form>
  );
}