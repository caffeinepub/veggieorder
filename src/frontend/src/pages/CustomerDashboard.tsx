import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Leaf,
  LogOut,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Order, Vegetable } from "../backend.d";
import { useAuth } from "../context/AuthContext";
import {
  OrderStatus,
  useCustomerOrders,
  usePlaceOrder,
  useVegetables,
} from "../hooks/useQueries";

interface CartItem {
  vegetable: Vegetable;
  quantity: number;
}

function statusBadge(status: OrderStatus) {
  const map: Record<OrderStatus, { label: string; className: string }> = {
    [OrderStatus.pending]: {
      label: "Pending",
      className: "bg-yellow-100 text-yellow-800",
    },
    [OrderStatus.inDelivery]: {
      label: "In Delivery",
      className: "bg-blue-100 text-blue-800",
    },
    [OrderStatus.delivered]: {
      label: "Delivered",
      className: "bg-green-100 text-green-800",
    },
    [OrderStatus.cancelled]: {
      label: "Cancelled",
      className: "bg-red-100 text-red-800",
    },
  };
  const s = map[status] ?? { label: String(status), className: "" };
  return <Badge className={s.className}>{s.label}</Badge>;
}

export default function CustomerDashboard() {
  const { session, logout } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [address, setAddress] = useState("");

  const { data: vegetables, isLoading: vegLoading } = useVegetables();
  const { data: orders, isLoading: ordersLoading } = useCustomerOrders(
    session.customerId,
  );
  const placeOrder = usePlaceOrder();

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = cart.reduce(
    (s, i) => s + i.vegetable.pricePerUnit * i.quantity,
    0,
  );

  const addToCart = (veg: Vegetable) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.vegetable.id === veg.id);
      if (existing) {
        return prev.map((c) =>
          c.vegetable.id === veg.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [...prev, { vegetable: veg, quantity: 1 }];
    });
  };

  const updateQty = (vegId: bigint, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.vegetable.id === vegId ? { ...c, quantity: c.quantity + delta } : c,
        )
        .filter((c) => c.quantity > 0),
    );
  };

  const removeFromCart = (vegId: bigint) => {
    setCart((prev) => prev.filter((c) => c.vegetable.id !== vegId));
  };

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      toast.error("Please enter a delivery address.");
      return;
    }
    if (!session.customerId) return;
    try {
      await placeOrder.mutateAsync({
        customerId: session.customerId,
        items: cart.map((c) => ({
          vegetableId: c.vegetable.id,
          quantity: c.quantity,
        })),
        address,
      });
      setCart([]);
      setCartOpen(false);
      setAddress("");
      toast.success("Order placed successfully! 🎉");
    } catch {
      toast.error("Failed to place order. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-6 h-6" />
            <span className="font-display font-bold text-xl">
              Fresh Veggie Market
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm opacity-90">
              Hi, {session.customerName || "Customer"}!
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground hover:bg-white/20"
              onClick={logout}
              data-ocid="customer.logout.button"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        <Tabs defaultValue="shop">
          <TabsList className="mb-6" data-ocid="customer.tabs.panel">
            <TabsTrigger value="shop" data-ocid="customer.shop.tab">
              <Leaf className="w-4 h-4 mr-2" /> Shop
            </TabsTrigger>
            <TabsTrigger value="orders" data-ocid="customer.orders.tab">
              <Package className="w-4 h-4 mr-2" /> My Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shop">
            <h2 className="text-2xl font-display font-bold mb-4">
              Fresh Vegetables
            </h2>
            {vegLoading ? (
              <div
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                data-ocid="catalog.loading_state"
              >
                {["a", "b", "c", "d", "e", "f"].map((k) => (
                  <Skeleton key={k} className="h-48 rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(vegetables ?? []).length === 0 ? (
                  <div
                    className="col-span-full text-center py-16 text-muted-foreground"
                    data-ocid="catalog.empty_state"
                  >
                    No vegetables available yet.
                  </div>
                ) : (
                  (vegetables ?? []).map((veg, idx) => {
                    const cartItem = cart.find(
                      (c) => c.vegetable.id === veg.id,
                    );
                    return (
                      <motion.div
                        key={veg.id.toString()}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        data-ocid={`catalog.item.${idx + 1}`}
                      >
                        <Card className="shadow-card hover:shadow-lg transition-shadow overflow-hidden">
                          <div className="bg-secondary h-28 flex items-center justify-center text-5xl">
                            {getVegEmoji(veg.name)}
                          </div>
                          <CardContent className="p-3">
                            <h3 className="font-semibold text-sm truncate">
                              {veg.name}
                            </h3>
                            <p className="text-primary font-bold text-base">
                              ₹{veg.pricePerUnit}/{veg.unit}
                            </p>
                            <p className="text-xs text-muted-foreground mb-2">
                              Stock: {veg.stock} {veg.unit}
                            </p>
                            {cartItem ? (
                              <div className="flex items-center gap-2 justify-between">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-7 w-7"
                                  onClick={() => updateQty(veg.id, -1)}
                                  data-ocid={`catalog.qty_minus.${idx + 1}`}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="font-bold text-sm">
                                  {cartItem.quantity}
                                </span>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-7 w-7"
                                  onClick={() => updateQty(veg.id, 1)}
                                  disabled={cartItem.quantity >= veg.stock}
                                  data-ocid={`catalog.qty_plus.${idx + 1}`}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                className="w-full h-8 text-xs"
                                onClick={() => addToCart(veg)}
                                disabled={veg.stock === 0}
                                data-ocid={`catalog.add_button.${idx + 1}`}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                {veg.stock === 0 ? "Out of Stock" : "Add"}
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders">
            <h2 className="text-2xl font-display font-bold mb-4">My Orders</h2>
            {ordersLoading ? (
              <div className="space-y-3" data-ocid="orders.loading_state">
                {["a", "b", "c"].map((k) => (
                  <Skeleton key={k} className="h-24" />
                ))}
              </div>
            ) : (orders ?? []).length === 0 ? (
              <div
                className="text-center py-16 text-muted-foreground"
                data-ocid="orders.empty_state"
              >
                <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No orders yet. Start shopping!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(orders ?? []).map((order: Order, idx: number) => (
                  <Card
                    key={order.id.toString()}
                    className="shadow-card"
                    data-ocid={`orders.item.${idx + 1}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm">
                            Order #{order.id.toString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(
                              Number(order.timestamp) / 1_000_000,
                            ).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {order.address}
                          </p>
                          <p className="text-sm font-bold text-primary mt-1">
                            ₹{order.totalAmount.toFixed(2)}
                          </p>
                        </div>
                        <div>{statusBadge(order.status)}</div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {order.items.map((item) => (
                          <span
                            key={item.vegetableId.toString()}
                            className="text-xs bg-secondary px-2 py-0.5 rounded-full"
                          >
                            ID {item.vegetableId.toString()} × {item.quantity}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              size="lg"
              className="rounded-full h-16 w-16 shadow-xl relative"
              onClick={() => setCartOpen(true)}
              data-ocid="cart.open_modal_button"
            >
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                {totalItems}
              </span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent
          className="w-full sm:max-w-md flex flex-col"
          data-ocid="cart.sheet"
        >
          <SheetHeader>
            <SheetTitle className="font-display text-xl flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" /> Your Cart
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {cart.length === 0 ? (
              <p
                className="text-center text-muted-foreground py-8"
                data-ocid="cart.empty_state"
              >
                Cart is empty
              </p>
            ) : (
              cart.map((item, idx) => (
                <div
                  key={item.vegetable.id.toString()}
                  className="flex items-center gap-3 p-3 bg-secondary rounded-lg"
                  data-ocid={`cart.item.${idx + 1}`}
                >
                  <span className="text-2xl">
                    {getVegEmoji(item.vegetable.name)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {item.vegetable.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ₹{item.vegetable.pricePerUnit} / {item.vegetable.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => updateQty(item.vegetable.id, -1)}
                      data-ocid={`cart.minus.${idx + 1}`}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-bold">
                      {item.quantity}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => updateQty(item.vegetable.id, 1)}
                      data-ocid={`cart.plus.${idx + 1}`}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => removeFromCart(item.vegetable.id)}
                    data-ocid={`cart.delete_button.${idx + 1}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
          {cart.length > 0 && (
            <SheetFooter className="flex flex-col gap-3 pt-4 border-t">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">₹{totalPrice.toFixed(2)}</span>
              </div>
              <div className="space-y-1">
                <Label htmlFor="address">Delivery Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter your full delivery address..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  data-ocid="cart.address.textarea"
                />
              </div>
              <Button
                className="w-full"
                onClick={handlePlaceOrder}
                disabled={placeOrder.isPending}
                data-ocid="cart.place_order.button"
              >
                {placeOrder.isPending ? "Placing Order..." : "Place Order"}
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      <footer className="text-center text-xs text-muted-foreground py-4 border-t">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}

function getVegEmoji(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("tomato")) return "🍅";
  if (lower.includes("potato")) return "🥔";
  if (lower.includes("onion")) return "🧅";
  if (
    lower.includes("spinach") ||
    lower.includes("leaf") ||
    lower.includes("green")
  )
    return "🥬";
  if (lower.includes("carrot")) return "🥕";
  if (lower.includes("cucumber")) return "🥒";
  if (lower.includes("pepper") || lower.includes("chilli")) return "🌶️";
  if (lower.includes("corn")) return "🌽";
  if (lower.includes("broccoli")) return "🥦";
  if (lower.includes("eggplant") || lower.includes("brinjal")) return "🍆";
  if (lower.includes("garlic")) return "🧄";
  if (lower.includes("mushroom")) return "🍄";
  return "🥗";
}
