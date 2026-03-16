import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type VegetableId = bigint;
export interface AccountingSummary {
    inDeliveryOrders: bigint;
    cancelledOrders: bigint;
    totalOrders: bigint;
    pendingOrders: bigint;
    dailyBreakdown: Array<DailySales>;
    totalRevenue: number;
    deliveredOrders: bigint;
}
export type Time = bigint;
export interface DailySales {
    date: bigint;
    totalSales: number;
}
export type CustomerId = bigint;
export interface OrderItem {
    vegetableId: VegetableId;
    quantity: number;
}
export interface Vegetable {
    id: VegetableId;
    name: string;
    unit: string;
    pricePerUnit: number;
    stock: number;
    imageUrl?: string;
}
export interface Order {
    id: OrderId;
    status: OrderStatus;
    totalAmount: number;
    address: string;
    timestamp: Time;
    customerId: CustomerId;
    items: Array<OrderItem>;
}
export interface UserProfile {
    name: string;
    phone: string;
}
export type OrderId = bigint;
export enum OrderStatus {
    inDelivery = "inDelivery",
    cancelled = "cancelled",
    pending = "pending",
    delivered = "delivered"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addVegetable(name: string, unit: string, pricePerUnit: number, stock: number, imageUrl: string | null): Promise<VegetableId>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAccountingSummary(): Promise<AccountingSummary>;
    getAllCustomers(): Promise<Array<UserProfile>>;
    getAllOrders(): Promise<Array<Order>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomerOrders(customerId: CustomerId): Promise<Array<Order>>;
    getCustomerProfile(customerId: CustomerId): Promise<UserProfile>;
    getOrder(orderId: OrderId): Promise<Order>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVegetable(id: VegetableId): Promise<Vegetable>;
    getVegetables(): Promise<Array<Vegetable>>;
    isCallerAdmin(): Promise<boolean>;
    loginCustomer(phone: string, password: string): Promise<CustomerId>;
    placeOrder(customerId: CustomerId, items: Array<OrderItem>, address: string): Promise<OrderId>;
    registerCustomer(name: string, phone: string, password: string): Promise<CustomerId>;
    removeVegetable(id: VegetableId): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateOrderStatus(orderId: OrderId, status: OrderStatus): Promise<void>;
    updateVegetable(id: VegetableId, name: string, unit: string, pricePerUnit: number, stock: number, imageUrl: string | null): Promise<void>;
}
