export default function AuthSubmitButton({ loading, label, loadingLabel }) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-80"
    >
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black motion-reduce:animate-none"
          aria-hidden="true"
        />
      )}
      {loading ? loadingLabel : label}
    </button>
  );
}