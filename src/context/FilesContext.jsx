import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";
import { useDrive } from "./DriveContext";
import { computeStats } from "../utils/files";

const FilesContext = createContext(null);

export function FilesProvider({ children }) {
  const { user } = useAuth();
  const { refreshQuota } = useDrive();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const response = await api.get("/files");
      setFiles(response.data);
      setError("");
    } catch {
      setError("Could not load files.");
    }
    refreshQuota(); // fire and forget; no-op unless Drive is connected
  }, [refreshQuota]);

  useEffect(() => {
    if (!user) {
      setFiles([]);
      return;
    }
    setLoading(true);
    reload().finally(() => setLoading(false));
  }, [user, reload]);

  const stats = useMemo(() => computeStats(files), [files]);
  const value = useMemo(
    () => ({ files, stats, loading, error, reload }),
    [files, stats, loading, error, reload]
  );

  return <FilesContext.Provider value={value}>{children}</FilesContext.Provider>;
}

export function useFiles() {
  return useContext(FilesContext);
}