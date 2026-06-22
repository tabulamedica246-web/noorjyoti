import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const AUTH_IDENTITY_QUERY_KEY = ["__auth_identity__"] as const;

async function fetchMyIdentity(): Promise<string | null> {
  const res = await fetch("/api/me", { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`/api/me responded with ${res.status}`);
  const body = (await res.json()) as { userId: string };
  return body.userId;
}

export function AuthBridge() {
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  const { data, refetch } = useQuery({
    queryKey: AUTH_IDENTITY_QUERY_KEY,
    queryFn: fetchMyIdentity,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 15_000,
    retry: false,
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key == null || e.key.startsWith("__clerk")) {
        void refetch();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [refetch]);

  useEffect(() => {
    const currentUserId = data === undefined ? undefined : data;

    if (prevUserIdRef.current === undefined) {
      prevUserIdRef.current = currentUserId;
      return;
    }

    if (currentUserId !== prevUserIdRef.current) {
      prevUserIdRef.current = currentUserId;
      qc.clear();
    }
  }, [data, qc]);

  return null;
}
