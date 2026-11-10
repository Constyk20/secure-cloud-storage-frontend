import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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
  const [busy, setBusy] = useState(null); // "connect" | "disconnect" | "verify" | null
  const [notice, setNotice] = useState(null); // { type: "success" | "error" | "warning", message }

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

  useEffect(() => {
    if (user) {
      refresh();
    } else {
      setStatus(null);
    }
  }, [user, refresh]);

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
      }
    }
    setBusy(null);
  }, [refresh]);

  const dismissNotice = useCallback(() => setNotice(null), []);

  const value = useMemo(
    () => ({ status, busy, notice, connect, disconnect, verify, refresh, dismissNotice }),
    [status, busy, notice, connect, disconnect, verify, refresh, dismissNotice]
  );

  return <DriveContext.Provider value={value}>{children}</DriveContext.Provider>;
}

export function useDrive() {
  return useContext(DriveContext);
}