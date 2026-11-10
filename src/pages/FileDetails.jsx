import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import FileBadge from "../components/FileBadge";
import { extractApiError } from "../utils/errors";
import { formatBytes, formatDate } from "../utils/files";

export default function FileDetails() {
  const { fileId } = useParams();
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/files/${fileId}`)
      .then((response) => setFile(response.data))
      .catch(() => setError("File not found or you are not allowed to view it."));
  }, [fileId]);

  async function download() {
    setError("");
    try {
      const response = await api.get(`/files/${fileId}/download`, { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      const { code, message } = await extractApiError(
        err,
        "Download blocked. The file failed integrity verification or the request was not authorized."
      );
      setError(
        code === null && err.response?.status === 409
          ? "Download blocked. The file failed integrity verification."
          : message
      );
    }
  }

  if (!file && error) return <p className="text-sm text-rose-300">{error}</p>;
  if (!file) return <p className="text-muted">Loading file...</p>;

  return (
    <section className="max-w-xl rounded-xl bg-card p-6 ring-1 ring-line">
      <Link className="text-sm text-emerald-300 hover:underline" to="/files">Back to my files</Link>
      <div className="mt-4 flex items-center gap-3">
        <FileBadge file={file} />
        <h1 className="min-w-0 break-words text-2xl font-semibold">{file.filename}</h1>
      </div>
      <dl className="mt-6 grid grid-cols-[110px_1fr] gap-y-3 text-sm">
        <dt className="text-muted">Size</dt>
        <dd>{formatBytes(file.size)} ({file.size} bytes)</dd>
        <dt className="text-muted">Type</dt>
        <dd>{file.content_type}</dd>
        <dt className="text-muted">Uploaded</dt>
        <dd>{formatDate(file.uploaded_at)}</dd>
        <dt className="text-muted">Storage</dt>
        <dd>{file.storage_provider === "google_drive" ? "Google Drive" : "Default storage"}</dd>
        <dt className="text-muted">Encryption</dt>
        <dd>{file.encryption_status}</dd>
        <dt className="text-muted">Integrity</dt>
        <dd>{file.integrity_status}</dd>
      </dl>
      {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
      <button
        type="button"
        className="mt-6 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-emerald-400"
        onClick={download}
      >
        Download original file
      </button>
    </section>
  );
}