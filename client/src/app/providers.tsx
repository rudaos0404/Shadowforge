import { useEffect } from "react";
import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "../stores/auth.store";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function AppProviders({ children }: PropsWithChildren) {
  const initToken = useAuthStore((s) => s.initToken);

  useEffect(() => {
    initToken();
  }, [initToken]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
