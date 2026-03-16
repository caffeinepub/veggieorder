import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useActor } from "./hooks/useActor";
import AdminDashboard from "./pages/AdminDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import LoginPage from "./pages/LoginPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

const DEFAULT_VEGETABLES = [
  { name: "Tomatoes", unit: "kg", pricePerUnit: 40, stock: 100 },
  { name: "Potatoes", unit: "kg", pricePerUnit: 25, stock: 200 },
  { name: "Onions", unit: "kg", pricePerUnit: 30, stock: 150 },
  { name: "Spinach", unit: "bunch", pricePerUnit: 15, stock: 80 },
  { name: "Carrots", unit: "kg", pricePerUnit: 35, stock: 90 },
  { name: "Cucumber", unit: "piece", pricePerUnit: 10, stock: 120 },
];

function SeedVegetables() {
  const { actor, isFetching } = useActor();
  const seeded = useRef(false);

  useEffect(() => {
    if (!actor || isFetching || seeded.current) return;
    seeded.current = true;

    actor.getVegetables().then((existing) => {
      if (existing.length === 0) {
        Promise.all(
          DEFAULT_VEGETABLES.map((v) =>
            actor.addVegetable(v.name, v.unit, v.pricePerUnit, v.stock, null),
          ),
        ).then(() => {
          queryClient.invalidateQueries({ queryKey: ["vegetables"] });
        });
      }
    });
  }, [actor, isFetching]);

  return null;
}

function AppContent() {
  const { session } = useAuth();

  if (session.role === "admin") return <AdminDashboard />;
  if (session.role === "customer") return <CustomerDashboard />;
  return <LoginPage />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SeedVegetables />
        <AppContent />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
