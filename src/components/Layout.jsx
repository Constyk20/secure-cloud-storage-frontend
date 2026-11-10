import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { FolderOpen, LayoutGrid, LogOut, Shield, ShieldCheck, UploadCloud, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useFiles } from "../context/FilesContext";
import GoogleDriveCard, { DriveNotice } from "./GoogleDriveCard";
import { CATEGORIES, CATEGORY_KEYS, formatBytes } from "../utils/files";

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
    isActive ? "bg-white/10 text-white" : "text-muted hover:bg-white/5 hover:text-ink"
  }`;

function StorageMeter() {
  const { stats } = useFiles();
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">Storage</span>
        <span className="text-xs text-muted">{formatBytes(stats.totalBytes)} used</span>
      </div>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-line">
        {CATEGORY_KEYS.map((key) => {
          const bytes = stats.byCategory[key].bytes;
          if (!bytes || !stats.totalBytes) return null;
          return (
            <div
              key={key}
              className={CATEGORIES[key].bar}
              style={{ width: `${(bytes / stats.totalBytes) * 100}%` }}
              title={`${CATEGORIES[key].label}: ${formatBytes(bytes)}`}
            />
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
        {CATEGORY_KEYS.map((key) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${CATEGORIES[key].bar}`} />
            {CATEGORIES[key].label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen md:grid md:grid-cols-[270px_1fr]">
      <aside className="flex flex-col gap-6 border-b border-line bg-panel p-5 md:sticky md:top-0 md:h-screen md:self-start md:overflow-y-auto md:border-b-0 md:border-r">
        <div className="flex items-center gap-2 font-bold text-emerald-400">
          <Shield size={22} />
          <span>Secure Cloud</span>
        </div>

        <StorageMeter />

        <nav className="flex flex-wrap gap-1 md:flex-col">
          <NavLink to="/" className={linkClass} end>
            <LayoutGrid size={16} /> Overview
          </NavLink>
          <NavLink to="/files" className={linkClass}>
            <FolderOpen size={16} /> My Files
          </NavLink>
          <NavLink to="/security" className={linkClass}>
            <ShieldCheck size={16} /> Security
          </NavLink>
          {user?.role === "admin" && (
            <NavLink to="/admin" className={linkClass}>
              <Users size={16} /> Admin
            </NavLink>
          )}
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          <GoogleDriveCard />
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-black transition hover:bg-emerald-400"
            onClick={() => navigate("/files")}
          >
            <UploadCloud size={16} /> Upload files
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-muted transition hover:bg-white/5 hover:text-ink"
            onClick={logout}
          >
            <LogOut size={16} /> Log out
          </button>
        </div>
      </aside>

      <main className="min-w-0 p-6 md:p-8">
        <DriveNotice />
        <Outlet />
      </main>
    </div>
  );
}