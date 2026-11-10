// Reads { code, message } from an axios error, including blob error bodies from downloads.
export async function extractApiError(err, fallback) {
  const data = err?.response?.data;
  let payload = data;

  if (typeof Blob !== "undefined" && data instanceof Blob) {
    try {
      payload = JSON.parse(await data.text());
    } catch {
      payload = null;
    }
  }

  const detail = payload?.detail;
  if (detail && typeof detail === "object") {
    return { code: detail.code || null, message: detail.message || fallback };
  }
  if (typeof detail === "string") return { code: null, message: detail };
  return { code: null, message: fallback };
}