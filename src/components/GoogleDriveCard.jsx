import { AlertTriangle, Cloud, CloudOff, RefreshCw, X } from "lucide-react";
import { useDrive } from "../context/DriveContext";
import { formatBytes } from "../utils/files";

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

function Switch({ checked, disabled, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition disabled:opacity-60 ${
        checked ? "bg-emerald-500" : "bg-line"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
          checked ? "left-[18px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function QuotaBar({ quota }) {
  if (quota === undefined) {
    return <p className="mt-3 text-[11px] text-muted">Loading storage details…</p>;
  }
  if (quota === null) {
    return <p className="mt-3 text-[11px] text-muted">Storage details unavailable.</p>;
  }

  const used = quota.usage ?? 0;
  const percent = quota.limit ? Math.min(100, (used / quota.limit) * 100) : 0;
  const tone = percent >= 90 ? "bg-rose-400" : percent >= 75 ? "bg-amber-300" : "bg-emerald-400";

  return (
    <div className="mt-3">
      <div className="flex items-baseline justify-between gap-2 text-[11px]">
        <span>Drive storage</span>
        <span className="text-muted">
          {quota.unlimited ? `${formatBytes(used)} used` : `${formatBytes(used)} of ${formatBytes(quota.limit)}`}
        </span>
      </div>
      {!quota.unlimited && (
        <div
          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(percent)}
          aria-label="Google Drive storage used"
        >
          <div className={`h-full ${tone}`} style={{ width: `${percent}%` }} />
        </div>
      )}
      <p className="mt-1 text-[11px] text-muted">
        {formatBytes(quota.app_bytes)} used by this app. The total is shared with Gmail and Photos.
      </p>
      {percent >= 90 && <p className="mt-1 text-[11px] text-rose-300">Your Drive is almost full.</p>}
    </div>
  );
}

export default function GoogleDriveCard() {
  const { status, quota, busy, connect, disconnect, verify, setStorage } = useDrive();

  function confirmDisconnect() {
    const count = status?.drive_file_count || 0;
    const warning =
      count > 0
        ? `${count} of your files are stored in Google Drive. They will be unavailable until you reconnect the same Google account, and new uploads will use the default storage.\n\nDisconnect anyway?`
        : "Disconnect Google Drive? Access will be revoked at Google.";
    if (window.confirm(warning)) disconnect();
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

        <QuotaBar quota={quota} />

        <div className="mt-3 flex items-start justify-between gap-3">
          <span className="text-xs">Store new uploads in Drive</span>
          <Switch
            checked={status.storage_enabled}
            disabled={busy !== null}
            onChange={setStorage}
            label="Store new uploads in Google Drive"
          />
        </div>
        <p className="mt-1 text-[11px] text-muted">
          {status.storage_enabled
            ? "Encrypted files are saved in the “Secure Cloud Storage” folder of your Drive. Older files stay in the default storage."
            : "New uploads use the default storage."}
        </p>
        {status.drive_file_count > 0 && (
          <p className="mt-1 text-[11px] text-muted">{status.drive_file_count} file(s) stored in your Drive.</p>
        )}

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
        {status.drive_file_count > 0 && (
          <p className="mt-1 text-[11px] text-muted">
            {status.drive_file_count} file(s) in your Drive are unavailable until you reconnect.
          </p>
        )}
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
        {status.drive_file_count > 0 && (
          <p className="mt-1 text-[11px] text-muted">
            {status.drive_file_count} file(s) are stored in a Drive that isn’t connected. Connect the same Google
            account to access them.
          </p>
        )}
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