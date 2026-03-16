import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type OrderItem, OrderStatus } from "../backend.d";
import { useActor } from "./useActor";

export { OrderStatus };

export function useVegetables() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["vegetables"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getVegetables();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllOrders() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["all-orders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllCustomers() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["all-customers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCustomers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCustomerOrders(customerId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["customer-orders", customerId?.toString()],
    queryFn: async () => {
      if (!actor || !customerId) return [];
      return actor.getCustomerOrders(customerId);
    },
    enabled: !!actor && !isFetching && customerId != null,
  });
}

export function useAccountingSummary() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["accounting"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getAccountingSummary();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePlaceOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      customerId,
      items,
      address,
    }: {
      customerId: bigint;
      items: OrderItem[];
      address: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.placeOrder(customerId, items, address);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customer-orders"] });
      qc.invalidateQueries({ queryKey: ["all-orders"] });
      qc.invalidateQueries({ queryKey: ["vegetables"] });
    },
  });
}

export function useUpdateOrderStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: { orderId: bigint; status: OrderStatus }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateOrderStatus(orderId, status);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-orders"] });
      qc.invalidateQueries({ queryKey: ["accounting"] });
    },
  });
}

export function useAddVegetable() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      unit,
      pricePerUnit,
      stock,
    }: {
      name: string;
      unit: string;
      pricePerUnit: number;
      stock: number;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.addVegetable(name, unit, pricePerUnit, stock, null);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vegetables"] }),
  });
}

export function useUpdateVegetable() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      unit,
      pricePerUnit,
      stock,
    }: {
      id: bigint;
      name: string;
      unit: string;
      pricePerUnit: number;
      stock: number;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateVegetable(id, name, unit, pricePerUnit, stock, null);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vegetables"] }),
  });
}

export function useRemoveVegetable() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.removeVegetable(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vegetables"] }),
  });
}

export function useLoginCustomer() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      phone,
      password,
    }: { phone: string; password: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.loginCustomer(phone, password);
    },
  });
}

export function useRegisterCustomer() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      name,
      phone,
      password,
    }: {
      name: string;
      phone: string;
      password: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.registerCustomer(name, phone, password);
    },
  });
}
