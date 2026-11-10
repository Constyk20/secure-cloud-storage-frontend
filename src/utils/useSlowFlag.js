import { useEffect, useState } from "react";

// Becomes true if `active` stays true for longer than delayMs.
export function useSlowFlag(active, delayMs = 4000) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!active) {
      setSlow(false);
      return undefined;
    }
    const timer = setTimeout(() => setSlow(true), delayMs);
    return () => clearTimeout(timer);
  }, [active, delayMs]);

  return slow;
}