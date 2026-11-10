import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield } from "lucide-react";
import AuthSubmitButton from "../components/AuthSubmitButton";
import { useAuth } from "../context/AuthContext";
import { useSlowFlag } from "../utils/useSlowFlag";

const inputClass =
  "mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none disabled:opacity-60";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
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
      await register(fullName, email, password);
      navigate("/login");
    } catch (err) {
      if (!err.response) {
        setError("Could not reach the server. Please check your connection and try again.");
      } else {
        const detail = err.response.data?.detail;
        setError(typeof detail === "string" ? detail : "Registration failed.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="mx-auto mt-[10vh] w-full max-w-md rounded-xl bg-card p-8 ring-1 ring-line" onSubmit={onSubmit}>
      <div className="mb-6 flex items-center gap-2 font-bold text-emerald-400">
        <Shield size={22} className={submitting ? "animate-pulse motion-reduce:animate-none" : ""} /> Secure Cloud
      </div>
      <h1 className="mb-6 text-2xl font-semibold">Create account</h1>
      <fieldset disabled={submitting} className="min-w-0">
        <label className="mb-4 block text-sm">Full name
          <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label className="mb-4 block text-sm">Email
          <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="mb-4 block text-sm">Password
          <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
        </label>
        {error && <p className="mb-4 text-sm text-rose-300" role="alert">{error}</p>}
        <AuthSubmitButton loading={submitting} label="Register" loadingLabel="Creating account…" />
      </fieldset>
      {slow && (
        <p className="mt-3 text-xs text-muted" role="status">
          Still working… the server may be waking up, and your account is also being secured with a new encryption key,
          so this can take up to a minute.
        </p>
      )}
      <p className="mt-4 text-sm text-muted">Already registered? <Link className="text-emerald-300 hover:underline" to="/login">Sign in</Link></p>
    </form>
  );
}