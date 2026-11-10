import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const DriveContext = createContext(null);

const REASON_MESSAGES = {
  invalid_state: "The connection link expired or was already used. Please try connecting again.",
  access_denied: "Google access was not granted.",
  oauth_error: "Google reported an error. Please try again.",
  token_exchange_failed: "Could not complete the connection with Google. Please try again.",
  drive_scope_missing: "Drive permission was not granted. Please allow access to files this app creates.",
  no_refresh_token: "Google did not return offline access. Please try connecting again.",
  userinfo_failed: "Could not read your Google account details. Please try again.",
  account_in_use: "That Google account is already linked to another user of this app.",
  account_has_drive_files:
    "You have files stored in the Drive you connected before. Reconnect that same Google account instead.",
};

export function googleErrorMessage(err, fallback) {
  const detail = err?.response?.data?.detail;
  if (detail && typeof detail === "object" && detail.message) return detail.message;
  if (typeof detail === "string") return detail;
  return fallback;
}

export function DriveProvider({ children }) {
  const { user } = useAuth();
  const { search, pathname } = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [quota, setQuota] = useState(undefined); // undefined = loading, null = unavailable
  const [busy, setBusy] = useState(null); // "connect" | "disconnect" | "verify" | "storage" | null
  const [notice, setNotice] = useState(null); // { type: "success" | "error" | "warning", message }
  const connectedRef = useRef(false);

  const refresh = useCallback(async (verify = false) => {
    try {
      const response = await api.get("/google/status", { params: verify ? { verify: true } : undefined });
      setStatus(response.data);
      return response.data;
    } catch (err) {
      setNotice({ type: "error", message: googleErrorMessage(err, "Could not load Google Drive status.") });
      return null;
    }
  }, []);

  const refreshQuota = useCallback(async () => {
    if (!connectedRef.current) return;
    try {
      const response = await api.get("/google/storage/quota");
      setQuota(response.data);
    } catch {
      // Keep any previous value; show "unavailable" only if we never had one.
      setQuota((previous) => previous ?? null);
    }
  }, []);

  useEffect(() => {
    if (user) {
      refresh();
    } else {
      setStatus(null);
    }
  }, [user, refresh]);

  // Load quota whenever the connection becomes (or stops being) active.
  const connectionState = status?.status;
  useEffect(() => {
    connectedRef.current = connectionState === "connected";
    if (connectedRef.current) {
      refreshQuota();
    } else {
      setQuota(undefined);
    }
  }, [connectionState, refreshQuota]);

  // Handle the redirect back from /google/callback (?google=connected | error&reason=...)
  useEffect(() => {
    const params = new URLSearchParams(search);
    const result = params.get("google");
    if (!result) return;
    if (result === "connected") {
      setNotice({ type: "success", message: "Google Drive connected." });
    } else {
      setNotice({
        type: "error",
        message: REASON_MESSAGES[params.get("reason")] || "Google Drive connection failed.",
      });
    }
    navigate(pathname, { replace: true });
    if (user) refresh();
  }, [search, pathname, navigate, user, refresh]);

  const connect = useCallback(async () => {
    setBusy("connect");
    setNotice(null);
    try {
      const response = await api.post("/google/connect");
      const url = response.data.authorization_url;
      if (typeof url !== "string" || !url.startsWith("https://accounts.google.com/")) {
        throw new Error("Unexpected authorization URL");
      }
      window.location.assign(url); // leaves the app; busy state intentionally stays on
    } catch (err) {
      setNotice({ type: "error", message: googleErrorMessage(err, "Could not start the Google connection.") });
      setBusy(null);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setBusy("disconnect");
    setNotice(null);
    try {
      const response = await api.post("/google/disconnect");
      if (response.data.revoked_at_google) {
        setNotice({ type: "success", message: "Google Drive disconnected and access revoked." });
      } else {
        setNotice({
          type: "warning",
          message:
            "Disconnected here, but Google could not be reached to revoke access. You can remove it at myaccount.google.com/permissions.",
        });
      }
      await refresh();
    } catch (err) {
      setNotice({ type: "error", message: googleErrorMessage(err, "Could not disconnect Google Drive.") });
    } finally {
      setBusy(null);
    }
  }, [refresh]);

  const verify = useCallback(async () => {
    setBusy("verify");
    setNotice(null);
    const data = await refresh(true);
    if (data) {
      if (data.verify_error) {
        setNotice({ type: "error", message: "Could not verify right now. Google may be unreachable; try again shortly." });
      } else if (data.status === "reauth_required") {
        setNotice({ type: "warning", message: "Google authorization expired or was revoked. Please reconnect." });
      } else {
        setNotice({ type: "success", message: "Google Drive connection is working." });
        refreshQuota();
      }
    }
    setBusy(null);
  }, [refresh, refreshQuota]);

  const setStorage = useCallback(
    async (enabled) => {
      setBusy("storage");
      setNotice(null);
      try {
        await api.put("/google/storage", { enabled });
        setNotice({
          type: "success",
          message: enabled
            ? "New uploads will be stored in your Google Drive."
            : "New uploads will use the default storage.",
        });
      } catch (err) {
        setNotice({ type: "error", message: googleErrorMessage(err, "Could not change the storage setting.") });
      } finally {
        await refresh();
        setBusy(null);
      }
    },
    [refresh]
  );

  const dismissNotice = useCallback(() => setNotice(null), []);

  const value = useMemo(
    () => ({ status, quota, busy, notice, connect, disconnect, verify, setStorage, refresh, refreshQuota, dismissNotice }),
    [status, quota, busy, notice, connect, disconnect, verify, setStorage, refresh, refreshQuota, dismissNotice]
  );

  return <DriveContext.Provider value={value}>{children}</DriveContext.Provider>;
}

export function useDrive() {
  return useContext(DriveContext);
}