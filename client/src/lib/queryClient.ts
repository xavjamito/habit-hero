import { QueryClient, QueryFunction, useMutation } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${await res.text()}`);
  }
}

export async function apiRequest(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  endpoint: string,
  body?: any
): Promise<Response> {
  const options: RequestInit = { method };

  if (body) {
    options.headers = {
      "Content-Type": "application/json",
    };
    options.body = JSON.stringify(body);
  }

  const res = await fetch(endpoint, options);
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});

// Enhanced mutation utility with direct cache updates
export const useMutationWithInvalidation = <T, P = void>(
  mutationFn: (params: P) => Promise<T>,
  queryKeys: string[],
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: any) => void;
    // Optional function to update cache directly 
    updateCache?: (data: T, queryKey: string) => void;
  } = {}
) => {
  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      // Update each of the affected queries
      queryKeys.forEach(queryKey => {
        if (options.updateCache) {
          // If a direct cache update function is provided, use it
          options.updateCache(data, queryKey);
        } else {
          // Otherwise, just invalidate and refetch
          queryClient.invalidateQueries({ queryKey: [queryKey] });
          // Force immediate refetch to update UI
          queryClient.refetchQueries({ queryKey: [queryKey] });
        }
      });
      
      // Call custom onSuccess if provided
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: options.onError,
  });
};
