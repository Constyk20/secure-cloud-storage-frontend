import { useEffect, useState } from "react";
import api from "../services/api";
import { useDrive } from "../context/DriveContext";
import { formatDate } from "../utils/files";

export default function Security() {
  const { status: drive } = useDrive();
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/security/status"), api.get("/security/logs")])
      .then(([statusResponse, logsResponse]) => {
        setStatus(statusResponse.data);
        setLogs(logsResponse.data);
      })
      .catch(() => setError("Could not load security information."));
  }, []);

  let driveLabel = "Checking…";
  if (drive) {
    if (!drive.configured) driveLabel = "Not configured on the server";
    else if (drive.status === "connected") driveLabel = `Connected (${drive.google_email}), scope: ${drive.scope}`;
    else if (drive.status === "reauth_required") driveLabel = "Authorization expired or revoked";
    else driveLabel = "Not connected";
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold">Security</h1>
      {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}

      {status && (
        <ul className="mt-6 space-y-2 rounded-xl bg-card p-5 text-sm ring-1 ring-line">
          <li><span className="text-muted">File encryption:</span> {status.encryption}</li>
          <li><span className="text-muted">Key wrapping:</span> {status.key_wrapping}</li>
          <li><span className="text-muted">Integrity:</span> {status.integrity}</li>
          <li><span className="text-muted">Backend can decrypt:</span> {String(status.backend_can_decrypt)}</li>
          <li><span className="text-muted">Google Drive:</span> {driveLabel}</li>
        </ul>
      )}

      <h2 className="mt-10 text-sm font-medium text-muted">Recent events</h2>
      {logs.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No events yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line overflow-hidden rounded-xl bg-card text-sm ring-1 ring-line">
          {logs.map((log) => (
            <li key={log.id} className="flex flex-wrap gap-x-3 px-4 py-3">
              <span className="text-xs text-muted">{formatDate(log.created_at)}</span>
              <span className="font-medium">{log.event}</span>
              <span className="text-muted">{log.details}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}