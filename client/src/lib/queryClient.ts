
import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage;
    let errorData: any = {};

    try {
      // Try to parse as JSON first
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        errorData = await res.json();
        errorMessage = errorData.message || JSON.stringify(errorData);
      } else {
        // If not JSON, just get the text
        errorMessage = await res.text();
      }
    } catch (error) {
      // If parsing fails, fall back to status text
      console.error("Failed to parse error response:", error);
      errorMessage = res.statusText;
    }

    // Create a custom error with the response status
    const customError: any = new Error(errorMessage || `Request failed with status ${res.status}`);
    customError.status = res.status;
    customError.statusText = res.statusText;
    customError.url = res.url;
    customError.data = errorData;

    throw customError;
  }
}

export async function apiRequest(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  url: string,
  data?: any
) {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const res = await fetch(url, options);

    // Log detailed error information for debugging
    if (!res.ok) {
      let errorData;
      try {
        errorData = await res.clone().json();
      } catch (e) {
        errorData = { message: "Could not parse error response" };
      }

      console.error("API request failed:", {
        status: res.status,
        statusText: res.statusText,
        url: res.url,
        data: errorData
      });
    }

    return res;
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
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

    // Check if there's content to parse
    const contentLength = res.headers.get('content-length');
    if (contentLength === '0') {
      return null;
    }

    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
