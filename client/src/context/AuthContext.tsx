import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { ApiError, setUnauthorizedHandler } from '../lib/api';
import { authApi } from '../lib/services';
import type { User } from '../lib/types';

interface AuthState {
  user: User | null;
  checking: boolean;
  sessionError: Error | null;
  retrySession: () => void;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);
const ME_KEY = ['auth', 'me'] as const;

async function fetchMe(): Promise<User | null> {
  try {
    return await authApi.me();
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const me = useQuery({ queryKey: ME_KEY, queryFn: fetchMe, staleTime: Infinity, retry: 1 });

  const setUser = useCallback(
    (user: User | null) => {
      if (!user) queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'auth' });
      queryClient.setQueryData(ME_KEY, user);
    },
    [queryClient],
  );

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, [setUser]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, [setUser]);

  const value = useMemo<AuthState>(
    () => ({
      user: me.data ?? null,
      checking: me.isPending,
      sessionError: me.isError ? me.error : null,
      retrySession: () => void me.refetch(),
      setUser,
      logout,
    }),
    [me, setUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
