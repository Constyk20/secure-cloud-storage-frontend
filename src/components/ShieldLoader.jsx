import { Shield } from "lucide-react";

export default function ShieldLoader({ label = "Loading…", fullScreen = false }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-4 ${fullScreen ? "min-h-screen" : "py-16"}`}
    >
      <div className="relative flex h-20 w-20 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping motion-reduce:animate-none" />
        <span className="absolute inset-2 rounded-full bg-emerald-400/10" />
        <Shield size={40} className="relative text-emerald-400 animate-pulse motion-reduce:animate-none" />
      </div>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}