import { useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Download, LayoutGrid, List, Search, Trash2, UploadCloud } from "lucide-react";
import api from "../services/api";
import CategoryCard from "../components/CategoryCard";
import FileBadge from "../components/FileBadge";
import { useFiles } from "../context/FilesContext";
import {
  CATEGORY_KEYS,
  MAX_UPLOAD_BYTES,
  categoryOf,
  formatBytes,
  formatDate,
  getExtension,
} from "../utils/files";

const VIEW_KEY = "files-view";

function readView() {
  try {
    return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

function FileActions({ file, busy, onDownload, onDelete }) {
  const base =
    "flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted transition hover:bg-white/5 hover:text-ink disabled:opacity-50";
  return (
    <div className="flex gap-2">
      <button type="button" className={base} onClick={() => onDownload(file)} disabled={busy} aria-label={`Download ${file.filename}`} title="Download">
        <Download size={15} />
      </button>
      <button type="button" className={`${base} hover:text-rose-300`} onClick={() => onDelete(file)} disabled={busy} aria-label={`Delete ${file.filename}`} title="Delete">
        <Trash2 size={15} />
      </button>
    </div>
  );
}

export default function Files() {
  const { files, stats, loading, error: loadError, reload } = useFiles();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInput = useRef(null);
  const [view, setViewState] = useState(readView);
  const [query, setQuery] = useState("");
  const [dragging, setDragging] = useState(false);
  const [upload, setUpload] = useState(null); // { index, total, name, percent }
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const requested = searchParams.get("category");
  const category = CATEGORY_KEYS.includes(requested) ? requested : "all";

  function setView(next) {
    setViewState(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* storage unavailable: keep in-memory choice */
    }
  }

  function toggleCategory(key) {
    const next = new URLSearchParams(searchParams);
    if (key === category) next.delete("category");
    else next.set("category", key);
    setSearchParams(next, { replace: true });
  }

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return files.filter(
      (file) =>
        (category === "all" || categoryOf(file) === category) &&
        file.filename.toLowerCase().includes(needle)
    );
  }, [files, category, query]);

  async function uploadFiles(list) {
    if (!list.length || upload) return;
    setError("");
    setMessage("");
    let done = 0;
    const failures = [];

    for (let i = 0; i < list.length; i += 1) {
      const file = list[i];
      if (file.size === 0) {
        failures.push(`${file.name}: file is empty`);
        continue;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        failures.push(`${file.name}: exceeds 20 MB`);
        continue;
      }
      setUpload({ index: i + 1, total: list.length, name: file.name, percent: 0 });
      const form = new FormData();
      form.append("file", file);
      try {
        await api.post("/files/upload", form, {
          onUploadProgress: (event) => {
            if (event.total) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setUpload((current) => (current ? { ...current, percent } : current));
            }
          },
        });
        done += 1;
      } catch (err) {
        const detail = err.response?.data?.detail;
        const reason = typeof detail === "string" ? detail : detail?.message || "upload failed";
        failures.push(`${file.name}: ${reason}`);
      }
    }

    setUpload(null);
    if (done) setMessage(`${done} file${done > 1 ? "s" : ""} encrypted and stored.`);
    if (failures.length) setError(failures.join(" · "));
    if (done) await reload();
  }

  async function download(file) {
    setError("");
    setBusyId(file.id);
    try {
      const response = await api.get(`/files/${file.id}/download`, { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Download failed integrity verification or you are not allowed to access this file.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(file) {
    if (!window.confirm(`Delete ${file.filename}?`)) return;
    setError("");
    setMessage("");
    setBusyId(file.id);
    try {
      await api.delete(`/files/${file.id}`);
      await reload();
    } catch {
      setError(`Could not delete ${file.filename}.`);
    } finally {
      setBusyId(null);
    }
  }

  const toggleBase = "flex h-8 w-8 items-center justify-center rounded-lg transition";

  return (
    <section>
      <h1 className="text-2xl font-semibold">My Files</h1>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          uploadFiles(Array.from(event.dataTransfer.files));
        }}
        className={`mt-6 rounded-xl border border-dashed px-6 py-10 text-center transition ${
          dragging ? "border-emerald-400 bg-emerald-500/5" : "border-line bg-panel"
        }`}
      >
        {upload ? (
          <div className="mx-auto max-w-sm">
            <p className="truncate text-sm">
              {upload.percent >= 100 ? "Encrypting and storing" : "Uploading"} {upload.name} ({upload.index} of {upload.total})
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
              <div className="h-full bg-emerald-400 transition-all" style={{ width: `${upload.percent}%` }} />
            </div>
          </div>
        ) : (
          <>
            <UploadCloud className="mx-auto text-emerald-400" size={28} />
            <p className="mt-3 text-sm">Drag and drop your files here to start uploading</p>
            <p className="my-2 text-[11px] uppercase tracking-wide text-muted">or</p>
            <button
              type="button"
              className="rounded-lg border border-emerald-500 px-5 py-1.5 text-sm text-emerald-300 transition hover:bg-emerald-500/10"
              onClick={() => fileInput.current?.click()}
            >
              Browse
            </button>
            <p className="mt-3 text-[11px] text-muted">Max 20 MB per file</p>
          </>
        )}
        <input
          ref={fileInput}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            uploadFiles(Array.from(event.target.files || []));
            event.target.value = "";
          }}
        />
      </div>

      {message && <p className="mt-4 text-sm text-emerald-300">{message}</p>}
      {(error || loadError) && <p className="mt-4 text-sm text-rose-300">{error || loadError}</p>}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CATEGORY_KEYS.map((key) => (
          <CategoryCard
            key={key}
            categoryKey={key}
            count={stats.byCategory[key].count}
            active={category === key}
            onClick={() => toggleCategory(key)}
          />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="relative w-full max-w-sm">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="w-full rounded-lg border border-line bg-panel py-2 pl-9 pr-3 text-sm placeholder:text-muted focus:border-emerald-500 focus:outline-none"
            placeholder="Search files"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        {category !== "all" && (
          <button type="button" className="text-xs text-muted underline hover:text-ink" onClick={() => toggleCategory(category)}>
            Show all types
          </button>
        )}
        <div className="ml-auto flex gap-1 rounded-lg bg-panel p-1">
          <button type="button" aria-label="Grid view" aria-pressed={view === "grid"} onClick={() => setView("grid")} className={`${toggleBase} ${view === "grid" ? "bg-white/10 text-emerald-300" : "text-muted"}`}>
            <LayoutGrid size={15} />
          </button>
          <button type="button" aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")} className={`${toggleBase} ${view === "list" ? "bg-white/10 text-emerald-300" : "text-muted"}`}>
            <List size={15} />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-muted">Loading files…</p>
      ) : visible.length === 0 ? (
        <p className="mt-6 text-sm text-muted">{files.length === 0 ? "No files stored yet." : "No files match your filters."}</p>
      ) : view === "grid" ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((file) => {
            const ext = getExtension(file.filename);
            return (
              <article key={file.id} className="rounded-xl bg-card p-4 ring-1 ring-line">
                <div className="flex items-center gap-3">
                  <FileBadge file={file} />
                  <div className="min-w-0">
                    <Link to={`/files/${file.id}`} className="block truncate text-sm font-medium hover:text-emerald-300" title={file.filename}>
                      {file.filename}
                    </Link>
                    <p className="text-xs text-muted">{ext ? `.${ext}` : "file"}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted">
                    {formatBytes(file.size)} · {formatDate(file.uploaded_at, false)}
                  </p>
                  <FileActions file={file} busy={busyId === file.id} onDownload={download} onDelete={remove} />
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl bg-card ring-1 ring-line">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th className="px-4 py-3 font-normal">Name</th>
                <th className="font-normal">Size</th>
                <th className="font-normal">Type</th>
                <th className="font-normal">Uploaded</th>
                <th className="font-normal">Encryption</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map((file) => (
                <tr key={file.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <FileBadge file={file} />
                      <Link className="hover:text-emerald-300" to={`/files/${file.id}`}>
                        {file.filename}
                      </Link>
                    </div>
                  </td>
                  <td className="text-muted">{formatBytes(file.size)}</td>
                  <td className="text-muted">{file.content_type}</td>
                  <td className="text-muted">{formatDate(file.uploaded_at)}</td>
                  <td className="text-muted">{file.encryption_status}</td>
                  <td className="py-3 pr-4">
                    <FileActions file={file} busy={busyId === file.id} onDownload={download} onDelete={remove} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}