import type { AuthUser, LoginCredentials } from "../types/auth";
import { ApiClientError, apiClient } from "@/lib/api-client";
import type { Branch } from "@/features/branches/types/branch";

const AUTH_TOKEN_KEY = "pos.auth-token";
const AUTH_USER_KEY = "pos.auth-user";

export type LoginResponse = {
  token: string;
};

export function normalizeAuthRole(value: string | undefined): AuthUser["role"] | undefined {
  if (!value) return undefined;

  switch (value) {
    case "admin":
    case "inventory-man":
    case "cashier":
    case "salesman":
      return value;
    case "salesMan":
      return "salesman";
    default:
      return undefined;
  }
}

export function isAuthRoleValue(value: string | undefined): value is AuthUser["role"] {
  return normalizeAuthRole(value) !== undefined;
}

export function getStoredAuthToken() {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
  return token && token.trim() ? token : null;
}

export function persistAuthToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
}

export function decodeJwtPayload(token: string): Record<string, unknown> {
  const normalizedToken = token.trim();
  if (!normalizedToken) {
    throw new Error("Authentication token is empty.");
  }

  const segments = normalizedToken.split(".");
  if (segments.length < 2) {
    throw new Error("Authentication token is invalid.");
  }

  const payloadSegment = segments[1];
  const paddedSegment = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = paddedSegment.length % 4 === 0 ? paddedSegment : paddedSegment + "=".repeat(4 - (paddedSegment.length % 4));

  try {
    const decoded = globalThis.atob(padded);
    const parsed = JSON.parse(decoded) as Record<string, unknown>;
    return parsed;
  } catch {
    throw new Error("Authentication token could not be decoded.");
  }
}

export function isAuthTokenExpired(token: string, now = Date.now()): boolean {
  const payload = decodeJwtPayload(token);
  const expiresAt = payload.exp;
  if (typeof expiresAt !== "number" || !Number.isFinite(expiresAt)) {
    throw new Error("Authentication token has no valid expiry.");
  }

  return expiresAt * 1000 <= now;
}

export function buildAuthUserFromToken(token: string, fallbackEmail?: string): AuthUser | null {
  const payload = decodeJwtPayload(token);
  if (isAuthTokenExpired(token)) {
    throw new Error("Authentication token has expired.");
  }

  const userId = payload.userId ?? payload.sub ?? payload._id ?? payload.id;
  const email = typeof payload.email === "string" ? payload.email : fallbackEmail ?? "";
  const rawRole = typeof payload.role === "string" ? payload.role : undefined;
  const role = normalizeAuthRole(rawRole);
  const name = typeof payload.name === "string" ? payload.name : email.split("@")[0] || "User";

  if (typeof userId !== "string" || !userId.trim() || !email.trim()) {
    return null;
  }

  if (!role) {
    return null;
  }

  const branchId = typeof payload.branchId === "string" ? payload.branchId : undefined;
  const branch = typeof payload.branch === "object" && payload.branch !== null ? (payload.branch as Partial<Branch>) : undefined;

  return {
    id: userId,
    name,
    email,
    role,
    ...(branchId ? { branchId } : {}),
    ...(branch ? { branch: branch as Branch } : {}),
  };
}

export async function loginWithBackend(credentials: LoginCredentials): Promise<{ token: string }> {
  try {
    return await apiClient.post<LoginResponse>("/login", {
      email: credentials.email,
      password: credentials.password,
    }, {
      skipAuth: true,
    });
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw new Error(error.message);
    }

    throw new Error("Unable to reach the authentication service.");
  }
}

export async function logoutFromBackend(token: string): Promise<void> {
  try {
    await apiClient.post<{ message?: string }>("/logout", undefined, { token });
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      return;
    }

    throw new Error(
      error instanceof ApiClientError ? error.message : "Unable to reach the logout service.",
    );
  }
}

export function getStoredAuthUser() {
  if (typeof window === "undefined") return null;
  const rawUser = window.localStorage.getItem(AUTH_USER_KEY);
  if (!rawUser) return null;

  try {
    const value: unknown = JSON.parse(rawUser);
    if (
      typeof value === "object" &&
      value !== null &&
      "id" in value &&
      typeof value.id === "string" &&
      "email" in value &&
      typeof value.email === "string"
    ) {
      return value as AuthUser;
    }

    return null;
  } catch {
    return null;
  }
}

export function persistAuthUser(user: AuthUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}
