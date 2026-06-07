export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

let sessionBlockHandler = null;

/** Registers a callback when the API returns a blocked-session 403. */
export function registerStatusBlockedHandler(handler) {
  sessionBlockHandler = handler;
}

/** Notifies AuthContext when a response indicates pending, rejected, or no university. */
function applySessionBlockFromResponse(res, data) {
  if (res.status !== 403 || !data || !sessionBlockHandler) return;

  if (data.status === "pending" || data.status === "rejected") {
    sessionBlockHandler({
      type: "status",
      status: data.status,
      message: data.message,
    });
    return;
  }

  if (data.code === "no_university") {
    sessionBlockHandler({
      type: "no_university",
      message: data.message,
    });
  }
}

/** JSON fetch wrapper; returns `{ res, data }` and handles session blocks. */
export async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  applySessionBlockFromResponse(res, data);

  return { res, data };
}
