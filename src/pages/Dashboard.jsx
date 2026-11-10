import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useFiles } from "../context/FilesContext";
import CategoryCard from "../components/CategoryCard";
import FileBadge from "../components/FileBadge";
import { CATEGORY_KEYS, formatBytes, formatDate } from "../utils/files";

export default function Dashboard() {
  const { user } = useAuth();
  const { files, stats } = useFiles();
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/security/status")
      .then((response) => setStatus(response.data))
      .catch(() => setError("Could not load security status."));
  }, []);

  const recent = files.slice(0, 5);

  return (
    <section>
      <h1 className="text-2xl font-semibold">Overview</h1>
      <p className="mt-1 text-sm text-muted">Signed in as {user?.email}</p>
      {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}

      {status && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Files", status.file_count],
            ["Encrypted", status.encrypted_file_count],
            ["Storage", formatBytes(status.storage_bytes)],
            ["Encryption", status.encryption],
          ].map(([label, value]) => (
            <article key={label} className="rounded-xl bg-card p-5 ring-1 ring-line">
              <h2 className="text-sm text-muted">{label}</h2>
              <strong className="mt-2 block text-xl">{value}</strong>
            </article>
          ))}
        </div>
      )}

      <h2 className="mt-10 text-sm font-medium text-muted">Browse by type</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CATEGORY_KEYS.map((key) => (
          <CategoryCard
            key={key}
            categoryKey={key}
            count={stats.byCategory[key].count}
            to={`/files?category=${key}`}
          />
        ))}
      </div>

      <h2 className="mt-10 text-sm font-medium text-muted">Recent files</h2>
      {recent.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No files stored yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line overflow-hidden rounded-xl bg-card ring-1 ring-line">
          {recent.map((file) => (
            <li key={file.id} className="flex items-center gap-3 px-4 py-3">
              <FileBadge file={file} />
              <Link className="min-w-0 flex-1 truncate text-sm hover:text-emerald-300" to={`/files/${file.id}`}>
                {file.filename}
              </Link>
              <span className="hidden text-xs text-muted sm:block">{formatBytes(file.size)}</span>
              <span className="text-xs text-muted">{formatDate(file.uploaded_at, false)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}