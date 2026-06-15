"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { useAuthListener } from "@/features/auth/hooks";
import { RouteGuard } from "./auth/route-guard";

function AuthInitializer() {
  useAuthListener();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer />
      <RouteGuard>{children}</RouteGuard>
    </QueryClientProvider>
  );
}
