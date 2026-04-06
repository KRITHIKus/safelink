import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import axios from "axios";

const BACKEND = "https://safelink-backend-3v3n.onrender.com";
const PING_ENDPOINT = `${BACKEND}/health`;
const PING_INTERVAL_MS = 100_000; // re-ping every 30s after first response

type SystemStatus = "checking" | "online" | "offline";

interface SystemStatusContextType {
  status: SystemStatus;
  latencyMs: number | null;
  lastChecked: Date | null;
  scanCount: number | null;
}

const SystemStatusContext = createContext<SystemStatusContextType>({
  status: "checking",
  latencyMs: null,
  lastChecked: null,
  scanCount: null,
});

export const SystemStatusProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<SystemStatus>("checking");
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [scanCount, setScanCount] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ping = async () => {
    const t0 = Date.now();
    try {
      const res = await axios.get(PING_ENDPOINT, { timeout: 8000 });
      const ms = Date.now() - t0;
      setStatus("online");
      setLatencyMs(ms);
      setLastChecked(new Date());
      if (Array.isArray(res.data)) setScanCount(res.data.length);
    } catch {
      setStatus("offline");
      setLatencyMs(null);
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    ping(); // immediate on mount
    intervalRef.current = setInterval(ping, PING_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <SystemStatusContext.Provider value={{ status, latencyMs, lastChecked, scanCount }}>
      {children}
    </SystemStatusContext.Provider>
  );
};

export const useSystemStatus = () => useContext(SystemStatusContext);