import { AlertTriangle, Cloud, CloudOff, RefreshCw, X } from "lucide-react";
import { useDrive } from "../context/DriveContext";

export function DriveNotice() {
  const { notice, dismissNotice } = useDrive();
  if (!notice) return null;
  const styles = {
    success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
    error: "border-rose-500/40 bg-rose-500/10 text-rose-200",
    warning: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  };
  return (
    <div
      role="status"
      className={`mb-6 flex items-start justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${
        styles[notice.type] || styles.error
      }`}
    >
      <span>{notice.message}</span>
      <button type="button" onClick={dismissNotice} aria-label="Dismiss message">
        <X size={16} />
      </button>
    </div>
  );
}

const primaryButton =
  "w-full rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-black transition hover:bg-emerald-400 disabled:opacity-60";
const outlineButton =
  "flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-ink transition hover:bg-white/5 disabled:opacity-60";

export default function GoogleDriveCard() {
  const { status, busy, connect, disconnect, verify } = useDrive();

  function confirmDisconnect() {
    if (window.confirm("Disconnect Google Drive? Access will be revoked at Google.")) disconnect();
  }

  let body;
  let pill = null;

  if (!status) {
    body = <p className="text-xs text-muted">Checking connection…</p>;
  } else if (!status.configured) {
    body = <p className="text-xs text-muted">Google Drive is not configured on the server.</p>;
  } else if (status.status === "connected") {
    pill = <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-300">Connected</span>;
    body = (
      <>
        <p className="truncate text-xs text-ink" title={status.google_email}>
          {status.google_email}
        </p>
        <p className="mt-1 text-[11px] text-muted">
          Drive storage for new uploads is not enabled yet. Files still use the current storage.
        </p>
        <div className="mt-3 flex gap-2">
          <button type="button" className={outlineButton} onClick={verify} disabled={busy !== null}>
            <RefreshCw size={13} className={busy === "verify" ? "animate-spin" : ""} />
            Check
          </button>
          <button type="button" className={outlineButton} onClick={confirmDisconnect} disabled={busy !== null}>
            <CloudOff size={13} />
            {busy === "disconnect" ? "Working…" : "Disconnect"}
          </button>
        </div>
      </>
    );
  } else if (status.status === "reauth_required") {
    pill = (
      <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-300">
        <AlertTriangle size={11} /> Reconnect
      </span>
    );
    body = (
      <>
        <p className="text-xs text-muted">Authorization expired or was revoked.</p>
        <button type="button" className={`${primaryButton} mt-3`} onClick={connect} disabled={busy !== null}>
          {busy === "connect" ? "Redirecting…" : "Reconnect Google Drive"}
        </button>
        <button
          type="button"
          className="mt-2 w-full text-center text-[11px] text-muted underline hover:text-ink"
          onClick={confirmDisconnect}
          disabled={busy !== null}
        >
          Remove connection
        </button>
      </>
    );
  } else {
    body = (
      <>
        <p className="text-xs text-muted">Connect your own Google Drive account to store encrypted files there.</p>
        <button type="button" className={`${primaryButton} mt-3`} onClick={connect} disabled={busy !== null}>
          {busy === "connect" ? "Redirecting…" : "Connect Google Drive"}
        </button>
      </>
    );
  }

  return (
    <div className="rounded-xl bg-card p-4 ring-1 ring-line">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Cloud size={16} className="text-emerald-400" /> Google Drive
        </span>
        {pill}
      </div>
      {body}
    </div>
  );
}