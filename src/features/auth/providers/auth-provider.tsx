"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  buildAuthUserFromToken,
  clearAuthToken,
  getStoredAuthToken,
  getStoredAuthUser,
  loginWithBackend,
  logoutFromBackend,
  persistAuthToken,
  persistAuthUser,
} from "../services/auth-api";
import { AUTH_SESSION_REJECTED_EVENT } from "../services/auth-session-events";
import type {
  AuthSession,
  AuthUser,
  LoginCredentials,
  StoredMockSession,
} from "../types/auth";

const LEGACY_SESSION_KEY = "pos.mock-auth-session";
const SESSION_COOKIE = "pos_session";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthSession>;
  logout: () => Promise<void> | void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function setSessionCookie(role: string) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SESSION_COOKIE}=${role}; Path=/; Max-Age=2592000; SameSite=Lax${secure}`;
}

function clearSessionCookie() {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

function clearLegacySession() {
  window.localStorage.removeItem(LEGACY_SESSION_KEY);
}

function readStoredSession(): StoredMockSession | null {
  const rawSession = window.localStorage.getItem("pos.auth-session");
  if (!rawSession) {
    return null;
  }

  try {
    const value: unknown = JSON.parse(rawSession);
    if (typeof value === "object" && value !== null) {
      const token = "token" in value && typeof value.token === "string" ? value.token : undefined;
      const issuedAt = "issuedAt" in value && typeof value.issuedAt === "string" ? value.issuedAt : undefined;
      if (token || issuedAt) {
        return { token, issuedAt };
      }
    }
  } catch {
    window.localStorage.removeItem("pos.auth-session");
  }

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedToken = getStoredAuthToken();
      const storedSession = readStoredSession();
      const tokenToRestore = storedToken ?? storedSession?.token ?? null;

      if (tokenToRestore) {
        try {
          const storedUser = getStoredAuthUser();
          const nextUser = buildAuthUserFromToken(
            tokenToRestore,
            storedUser?.email,
          );
          if (nextUser) {
            setUser(nextUser);
            setToken(tokenToRestore);
            setSessionCookie(nextUser.role);
            persistAuthUser(nextUser);
            setIsLoading(false);
            return;
          }
        } catch {
          // fall through to clear invalid or expired session
        }
      }

      clearAuthToken();
      clearLegacySession();
      clearSessionCookie();
      setUser(null);
      setToken(null);
      setIsLoading(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    function handleRejectedSession() {
      clearAuthToken();
      clearLegacySession();
      clearSessionCookie();
      setUser(null);
      setToken(null);
    }

    window.addEventListener(AUTH_SESSION_REJECTED_EVENT, handleRejectedSession);
    return () =>
      window.removeEventListener(
        AUTH_SESSION_REJECTED_EVENT,
        handleRejectedSession,
      );
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await loginWithBackend(credentials);
    const nextUser = buildAuthUserFromToken(response.token, credentials.email);

    if (!nextUser) {
      throw new Error("The authentication response does not contain a valid user profile.");
    }

    persistAuthToken(response.token);
    persistAuthUser(nextUser);
    setSessionCookie(nextUser.role);
    setUser(nextUser);
    setToken(response.token);

    return {
      user: nextUser,
      token: response.token,
      issuedAt: new Date().toISOString(),
    } satisfies AuthSession;
  }, []);

  const logout = useCallback(() => {
    const activeToken = token ?? getStoredAuthToken();

    clearAuthToken();
    clearLegacySession();
    clearSessionCookie();
    setUser(null);
    setToken(null);

    if (activeToken) {
      return logoutFromBackend(activeToken).catch(() => {
        // The local session is already cleared; backend logout is best effort.
      });
    }
  }, [token]);

  const value = useMemo(
    () => ({ user, token, isLoading, login, logout }),
    [user, token, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
