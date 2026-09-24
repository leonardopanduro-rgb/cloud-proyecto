import { createContext, useState } from 'react';
import { authService } from '../services/authService';
import { setToken } from '../services/api';
export const AuthContext = createContext(null);
const SESSION_KEY = 'cloudshop_session_v1';

function readSession() {
  try {
    const stored = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (!stored?.user) return null;
    setToken(stored.access_token || null);
    return stored;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);
  const user = session?.user || null;

  function saveSession(next) {
    setSession(next);
    setToken(next?.access_token || null);
    if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else localStorage.removeItem(SESSION_KEY);
  }

  async function authenticate(type, values) {
    const result = await authService[type](values);
    saveSession({ user: result.user, access_token: result.access_token || null });
  }
  function setUser(nextUser) {
    const resolved = typeof nextUser === 'function' ? nextUser(user) : nextUser;
    saveSession(resolved ? { ...session, user: resolved } : null);
  }
  function logout() { saveSession(null); }
  const isAdmin = user?.rol === 'admin';
  return <AuthContext.Provider value={{ user, setUser, authenticate, logout, isAdmin }}>{children}</AuthContext.Provider>;
}
