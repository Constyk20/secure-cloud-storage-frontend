export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // mirrors the backend limit

export const CATEGORY_KEYS = ["documents", "images", "video", "other"];

export const CATEGORIES = {
  documents: { label: "Documents", bar: "bg-amber-300" },
  images: { label: "Images", bar: "bg-violet-400" },
  video: { label: "Video", bar: "bg-rose-400" },
  other: { label: "Other", bar: "bg-emerald-400" },
};

const DOCUMENT_EXTENSIONS = [
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "md", "csv", "rtf", "odt", "ods", "odp",
];

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${index === 0 || value >= 10 ? Math.round(value) : value.toFixed(1)} ${units[index]}`;
}

export function getExtension(filename = "") {
  const index = filename.lastIndexOf(".");
  return index > 0 ? filename.slice(index + 1).toLowerCase() : "";
}

export function categoryOf(file) {
  const type = (file.content_type || "").toLowerCase();
  const ext = getExtension(file.filename);
  if (type.startsWith("image/")) return "images";
  if (type.startsWith("video/")) return "video";
  if (
    type.startsWith("text/") ||
    type.includes("pdf") ||
    type.includes("word") ||
    type.includes("sheet") ||
    type.includes("excel") ||
    type.includes("presentation") ||
    type.includes("powerpoint") ||
    type.includes("opendocument") ||
    DOCUMENT_EXTENSIONS.includes(ext)
  ) {
    return "documents";
  }
  return "other";
}

export function badgeFor(file) {
  const ext = getExtension(file.filename);
  const category = categoryOf(file);
  if (["doc", "docx", "odt", "rtf"].includes(ext)) return { label: "W", className: "bg-sky-600" };
  if (["xls", "xlsx", "csv", "ods"].includes(ext)) return { label: "X", className: "bg-emerald-600" };
  if (["ppt", "pptx", "odp"].includes(ext)) return { label: "P", className: "bg-orange-500" };
  if (ext === "pdf") return { label: "PDF", className: "bg-rose-600" };
  if (category === "images") return { label: "IMG", className: "bg-violet-500" };
  if (category === "video") return { label: "VID", className: "bg-rose-500" };
  if (category === "documents") return { label: "T", className: "bg-slate-500" };
  return { label: (ext[0] || "F").toUpperCase(), className: "bg-slate-600" };
}

export function computeStats(files) {
  const byCategory = Object.fromEntries(CATEGORY_KEYS.map((key) => [key, { count: 0, bytes: 0 }]));
  let totalBytes = 0;
  for (const file of files) {
    const key = categoryOf(file);
    const size = file.size || 0;
    byCategory[key].count += 1;
    byCategory[key].bytes += size;
    totalBytes += size;
  }
  return { totalBytes, count: files.length, byCategory };
}

// The API returns naive UTC timestamps; without a zone JS would read them as local time.
export function formatDate(iso, withTime = true) {
  if (!iso) return "";
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(iso);
  const date = new Date(hasZone ? iso : `${iso}Z`);
  return withTime ? date.toLocaleString() : date.toLocaleDateString();
}