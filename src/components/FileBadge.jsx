import { badgeFor } from "../utils/files";

export default function FileBadge({ file }) {
  const badge = badgeFor(file);
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${badge.className}`}
      aria-hidden="true"
    >
      {badge.label}
    </span>
  );
}