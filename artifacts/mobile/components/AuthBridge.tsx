import { useAuth } from "@clerk/expo";
import { useQueryClient } from "@tanstack/react-query";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { useEffect, useRef } from "react";

export function AuthBridge() {
  const { getToken, isLoaded, userId } = useAuth();
  const qc = useQueryClient();
  const prevUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!isLoaded) return;
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (prevUserId.current === undefined) {
      prevUserId.current = userId;
      return;
    }
    if (prevUserId.current !== userId) {
      prevUserId.current = userId;
      qc.clear();
    }
  }, [isLoaded, userId, qc]);

  return null;
}
