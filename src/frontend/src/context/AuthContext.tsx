import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

export type SessionRole = "admin" | "customer" | null;

export interface AuthSession {
  role: SessionRole;
  customerId: bigint | null;
  customerName: string;
}

interface AuthContextValue {
  session: AuthSession;
  loginAdmin: () => void;
  loginCustomer: (id: bigint, name: string) => void;
  logout: () => void;
}

const defaultSession: AuthSession = {
  role: null,
  customerId: null,
  customerName: "",
};

const AuthContext = createContext<AuthContextValue>({
  session: defaultSession,
  loginAdmin: () => {},
  loginCustomer: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession>(() => {
    try {
      const stored = localStorage.getItem("veggie_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          customerId:
            parsed.customerId != null ? BigInt(parsed.customerId) : null,
        };
      }
    } catch {
      // ignore
    }
    return defaultSession;
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        "veggie_session",
        JSON.stringify({
          ...session,
          customerId:
            session.customerId != null ? session.customerId.toString() : null,
        }),
      );
    } catch {
      // ignore
    }
  }, [session]);

  const loginAdmin = () =>
    setSession({ role: "admin", customerId: null, customerName: "" });
  const loginCustomer = (id: bigint, name: string) =>
    setSession({ role: "customer", customerId: id, customerName: name });
  const logout = () => {
    setSession(defaultSession);
    localStorage.removeItem("veggie_session");
  };

  return (
    <AuthContext.Provider
      value={{ session, loginAdmin, loginCustomer, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
