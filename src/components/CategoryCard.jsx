import { Link } from "react-router-dom";
import { CATEGORIES } from "../utils/files";

export default function CategoryCard({ categoryKey, count, active = false, to, onClick }) {
  const meta = CATEGORIES[categoryKey];
  const className = `relative block w-full overflow-hidden rounded-xl bg-card text-left ring-1 transition hover:bg-white/5 ${
    active ? "ring-emerald-400" : "ring-line"
  }`;
  const content = (
    <>
      <span className={`absolute inset-x-0 top-0 h-2.5 ${meta.bar}`} />
      <span className="flex h-24 items-end justify-between gap-3 p-4 pt-8">
        <span className="text-sm font-medium">{meta.label}</span>
        <span className="text-xs text-muted">
          {count} {count === 1 ? "file" : "files"}
        </span>
      </span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className} aria-pressed={active}>
      {content}
    </button>
  );
}