import { AUTH_SESSION_REJECTED_EVENT } from "@/features/auth/services/auth-session-events";

export class ApiConfigurationError extends Error {
  constructor(message = "Missing or invalid API configuration.") {
    super(message);
    this.name = "ApiConfigurationError";
  }
}

export class ApiClientError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  params?: Record<string, string | number | boolean | undefined>;
  token?: string | null;
  skipAuth?: boolean;
  preserveSessionOnUnauthorized?: boolean;
  body?: unknown;
};

function getApiBaseUrl(): string {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (!configuredBaseUrl) {
    throw new ApiConfigurationError(
      "Missing NEXT_PUBLIC_API_BASE_URL. Add the backend base URL in .env.local.",
    );
  }

  try {
    const url = new URL(configuredBaseUrl);
    if (!url.origin || !url.pathname) {
      throw new Error("Invalid API base URL.");
    }
    return url.toString().replace(/\/+$/, "");
  } catch {
    throw new ApiConfigurationError(
      "Invalid NEXT_PUBLIC_API_BASE_URL. Expected a valid absolute URL like http://localhost:6001/api/v1.",
    );
  }
}

export function buildApiUrl(path: string, params?: Record<string, string | number | boolean | undefined>) {
  const baseUrl = getApiBaseUrl().replace(/\/+$/, "");

  if (/^https?:\/\//i.test(path)) {
    return new URL(path).toString();
  }

  const normalizedPath = path.replace(/^\/+/, "");
  const url = new URL(`${baseUrl}/${normalizedPath}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

export async function requestJson<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    params,
    token,
    skipAuth = false,
    preserveSessionOnUnauthorized = false,
    headers,
    body,
    ...rest
  } = options;
  const requestHeaders = new Headers(headers);
  requestHeaders.set("ngrok-skip-browser-warning", "true");
  const requestBody =
    body === undefined || body === null
      ? undefined
      : body instanceof FormData || typeof body === "string" || body instanceof URLSearchParams || body instanceof Blob || body instanceof ArrayBuffer || ArrayBuffer.isView(body)
        ? body
        : JSON.stringify(body);
  if (
    requestBody !== undefined &&
    /^(GET|HEAD)$/i.test(options.method ?? "")
  ) {
    throw new ApiClientError(
      `The browser fetch API does not support a request body for ${options.method?.toUpperCase()} requests.`,
      0,
    );
  }

  if (!(options.method && /GET|DELETE/i.test(options.method)) && requestBody !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (!skipAuth && token) {
    requestHeaders.set("Authorization", token);
  }

  const fetchBody = requestBody as BodyInit | null | undefined;
  const requestConfig: RequestInit = {
    ...rest,
    headers: requestHeaders,
    body: fetchBody,
  };

  const response = await fetch(buildApiUrl(path, params), requestConfig);

  const contentType = response.headers.get("content-type") ?? "";
  const hasJsonBody = contentType.includes("application/json");
  const payload = hasJsonBody ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : `Request failed with status ${response.status}.`;

    if (response.status === 401) {
      if (
        !skipAuth &&
        !preserveSessionOnUnauthorized &&
        token &&
        typeof window !== "undefined"
      ) {
        window.dispatchEvent(new Event(AUTH_SESSION_REJECTED_EVENT));
      }
      throw new ApiClientError("Unauthorized. Please sign in again.", 401, payload);
    }

    throw new ApiClientError(message, response.status, payload);
  }

  return payload as T;
}

export const apiClient = {
  get<T>(path: string, options?: Omit<ApiRequestOptions, "method">) {
    return requestJson<T>(path, { ...options, method: "GET" });
  },
  post<T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">) {
    return requestJson<T>(path, {
      ...options,
      method: "POST",
      body,
    });
  },
  put<T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">) {
    return requestJson<T>(path, {
      ...options,
      method: "PUT",
      body,
    });
  },
  patch<T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, "method" | "body">) {
    return requestJson<T>(path, {
      ...options,
      method: "PATCH",
      body,
    });
  },
  del<T>(path: string, options?: Omit<ApiRequestOptions, "method" | "body">) {
    return requestJson<T>(path, { ...options, method: "DELETE" });
  },
};
