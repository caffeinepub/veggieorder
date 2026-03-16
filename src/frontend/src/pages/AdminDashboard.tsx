import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Leaf,
  Loader2,
  LogOut,
  Menu,
  Package,
  Pencil,
  Plus,
  ShoppingBag,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Vegetable } from "../backend.d";
import { useAuth } from "../context/AuthContext";
import {
  OrderStatus,
  useAccountingSummary,
  useAddVegetable,
  useAllCustomers,
  useAllOrders,
  useRemoveVegetable,
  useUpdateOrderStatus,
  useUpdateVegetable,
  useVegetables,
} from "../hooks/useQueries";

type AdminView = "orders" | "customers" | "catalog" | "accounting";

const NAV_ITEMS: { id: AdminView; label: string; icon: React.ReactNode }[] = [
  { id: "orders", label: "Orders", icon: <Package className="w-5 h-5" /> },
  { id: "customers", label: "Customers", icon: <Users className="w-5 h-5" /> },
  {
    id: "catalog",
    label: "Catalog",
    icon: <ShoppingBag className="w-5 h-5" />,
  },
  {
    id: "accounting",
    label: "Accounting",
    icon: <TrendingUp className="w-5 h-5" />,
  },
];

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

interface VegForm {
  name: string;
  unit: string;
  pricePerUnit: string;
  stock: string;
}

const emptyForm: VegForm = {
  name: "",
  unit: "kg",
  pricePerUnit: "",
  stock: "",
};

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [view, setView] = useState<AdminView>("orders");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [vegDialog, setVegDialog] = useState(false);
  const [editVeg, setEditVeg] = useState<Vegetable | null>(null);
  const [vegForm, setVegForm] = useState<VegForm>(emptyForm);

  const { data: vegetables, isLoading: vegLoading } = useVegetables();
  const { data: orders, isLoading: ordersLoading } = useAllOrders();
  const { data: customers, isLoading: custLoading } = useAllCustomers();
  const { data: accounting, isLoading: accLoading } = useAccountingSummary();

  const updateStatus = useUpdateOrderStatus();
  const addVeg = useAddVegetable();
  const updateVeg = useUpdateVegetable();
  const removeVeg = useRemoveVegetable();

  const openAddDialog = () => {
    setEditVeg(null);
    setVegForm(emptyForm);
    setVegDialog(true);
  };

  const openEditDialog = (veg: Vegetable) => {
    setEditVeg(veg);
    setVegForm({
      name: veg.name,
      unit: veg.unit,
      pricePerUnit: veg.pricePerUnit.toString(),
      stock: veg.stock.toString(),
    });
    setVegDialog(true);
  };

  const handleVegSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number.parseFloat(vegForm.pricePerUnit);
    const stock = Number.parseInt(vegForm.stock);
    if (Number.isNaN(price) || Number.isNaN(stock)) {
      toast.error("Please enter valid price and stock.");
      return;
    }
    try {
      if (editVeg) {
        await updateVeg.mutateAsync({
          id: editVeg.id,
          name: vegForm.name,
          unit: vegForm.unit,
          pricePerUnit: price,
          stock,
        });
        toast.success("Vegetable updated!");
      } else {
        await addVeg.mutateAsync({
          name: vegForm.name,
          unit: vegForm.unit,
          pricePerUnit: price,
          stock,
        });
        toast.success("Vegetable added!");
      }
      setVegDialog(false);
    } catch {
      toast.error("Failed to save vegetable.");
    }
  };

  const handleRemoveVeg = async (id: bigint) => {
    if (!confirm("Remove this vegetable from catalog?")) return;
    try {
      await removeVeg.mutateAsync(id);
      toast.success("Vegetable removed.");
    } catch {
      toast.error("Failed to remove vegetable.");
    }
  };

  const handleStatusChange = async (orderId: bigint, status: string) => {
    try {
      await updateStatus.mutateAsync({
        orderId,
        status: status as OrderStatus,
      });
      toast.success("Order status updated!");
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-sidebar text-sidebar-foreground shadow-md">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              data-ocid="admin.menu.toggle"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
            <Leaf className="w-6 h-6" />
            <span className="font-display font-bold text-xl">
              Admin Console
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={logout}
            data-ocid="admin.logout.button"
          >
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </Button>
        </div>
      </header>

      <div className="flex flex-1 relative">
        <aside
          className={`fixed md:sticky top-16 z-30 h-[calc(100vh-64px)] bg-sidebar text-sidebar-foreground w-56 flex flex-col py-4 transition-transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0`}
        >
          <nav className="flex flex-col gap-1 px-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setView(item.id);
                  setSidebarOpen(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setView(item.id);
                    setSidebarOpen(false);
                  }
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  view === item.id
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "hover:bg-sidebar-accent text-sidebar-foreground"
                }`}
                data-ocid={`admin.nav.${item.id}.link`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            className="fixed inset-0 bg-black/40 z-20 md:hidden w-full h-full border-0 cursor-default"
            onClick={closeSidebar}
            onKeyDown={(e) => {
              if (e.key === "Escape") closeSidebar();
            }}
          />
        )}

        <main className="flex-1 p-4 md:p-6 min-w-0">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* ===== ORDERS ===== */}
            {view === "orders" && (
              <div>
                <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
                  <Package className="w-6 h-6 text-primary" /> Orders
                </h2>
                {ordersLoading ? (
                  <div className="space-y-2" data-ocid="orders.loading_state">
                    {["a", "b", "c", "d", "e"].map((k) => (
                      <Skeleton key={k} className="h-12" />
                    ))}
                  </div>
                ) : (orders ?? []).length === 0 ? (
                  <div
                    className="text-center py-16 text-muted-foreground"
                    data-ocid="orders.empty_state"
                  >
                    No orders yet.
                  </div>
                ) : (
                  <div
                    className="overflow-x-auto rounded-xl border"
                    data-ocid="orders.table"
                  >
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Update</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(orders ?? []).map((order, idx) => (
                          <TableRow
                            key={order.id.toString()}
                            data-ocid={`orders.row.${idx + 1}`}
                          >
                            <TableCell className="font-mono text-xs">
                              #{order.id.toString()}
                            </TableCell>
                            <TableCell className="text-xs">
                              {order.customerId.toString()}
                            </TableCell>
                            <TableCell className="text-xs max-w-32 truncate">
                              {order.address}
                            </TableCell>
                            <TableCell className="font-semibold">
                              ₹{order.totalAmount.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-xs">
                              {new Date(
                                Number(order.timestamp) / 1_000_000,
                              ).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{statusBadge(order.status)}</TableCell>
                            <TableCell>
                              <Select
                                value={order.status}
                                onValueChange={(val) =>
                                  handleStatusChange(order.id, val)
                                }
                              >
                                <SelectTrigger
                                  className="w-36 h-8 text-xs"
                                  data-ocid={`orders.status.select.${idx + 1}`}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={OrderStatus.pending}>
                                    Pending
                                  </SelectItem>
                                  <SelectItem value={OrderStatus.inDelivery}>
                                    In Delivery
                                  </SelectItem>
                                  <SelectItem value={OrderStatus.delivered}>
                                    Delivered
                                  </SelectItem>
                                  <SelectItem value={OrderStatus.cancelled}>
                                    Cancelled
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {/* ===== CUSTOMERS ===== */}
            {view === "customers" && (
              <div>
                <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-primary" /> Customers
                </h2>
                {custLoading ? (
                  <div
                    className="space-y-2"
                    data-ocid="customers.loading_state"
                  >
                    {["a", "b", "c", "d", "e"].map((k) => (
                      <Skeleton key={k} className="h-10" />
                    ))}
                  </div>
                ) : (customers ?? []).length === 0 ? (
                  <div
                    className="text-center py-16 text-muted-foreground"
                    data-ocid="customers.empty_state"
                  >
                    No customers registered yet.
                  </div>
                ) : (
                  <div
                    className="overflow-x-auto rounded-xl border"
                    data-ocid="customers.table"
                  >
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Phone</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(customers ?? []).map((cust, idx) => (
                          <TableRow
                            key={cust.phone}
                            data-ocid={`customers.row.${idx + 1}`}
                          >
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell className="font-medium">
                              {cust.name}
                            </TableCell>
                            <TableCell>{cust.phone}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {/* ===== CATALOG ===== */}
            {view === "catalog" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                    <ShoppingBag className="w-6 h-6 text-primary" /> Catalog
                  </h2>
                  <Button
                    size="sm"
                    onClick={openAddDialog}
                    data-ocid="catalog.add_button"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Vegetable
                  </Button>
                </div>
                {vegLoading ? (
                  <div className="space-y-2" data-ocid="catalog.loading_state">
                    {["a", "b", "c", "d"].map((k) => (
                      <Skeleton key={k} className="h-12" />
                    ))}
                  </div>
                ) : (
                  <div
                    className="overflow-x-auto rounded-xl border"
                    data-ocid="catalog.table"
                  >
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>Price (₹)</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(vegetables ?? []).length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center text-muted-foreground py-8"
                              data-ocid="catalog.empty_state"
                            >
                              No vegetables in catalog.
                            </TableCell>
                          </TableRow>
                        ) : (
                          (vegetables ?? []).map((veg, idx) => (
                            <TableRow
                              key={veg.id.toString()}
                              data-ocid={`catalog.row.${idx + 1}`}
                            >
                              <TableCell className="font-medium">
                                {veg.name}
                              </TableCell>
                              <TableCell>{veg.unit}</TableCell>
                              <TableCell>₹{veg.pricePerUnit}</TableCell>
                              <TableCell>{veg.stock}</TableCell>
                              <TableCell className="flex gap-2">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8"
                                  onClick={() => openEditDialog(veg)}
                                  data-ocid={`catalog.edit_button.${idx + 1}`}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => handleRemoveVeg(veg.id)}
                                  data-ocid={`catalog.delete_button.${idx + 1}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}

            {/* ===== ACCOUNTING ===== */}
            {view === "accounting" && (
              <div>
                <h2 className="text-2xl font-display font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-primary" /> Accounting
                </h2>
                {accLoading ? (
                  <div
                    className="grid grid-cols-2 md:grid-cols-3 gap-4"
                    data-ocid="accounting.loading_state"
                  >
                    {["a", "b", "c", "d", "e", "f"].map((k) => (
                      <Skeleton key={k} className="h-28" />
                    ))}
                  </div>
                ) : accounting ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      <SummaryCard
                        title="Total Revenue"
                        value={`₹${accounting.totalRevenue.toFixed(2)}`}
                        color="text-primary"
                        ocid="accounting.revenue.card"
                      />
                      <SummaryCard
                        title="Total Orders"
                        value={accounting.totalOrders.toString()}
                        ocid="accounting.total.card"
                      />
                      <SummaryCard
                        title="Pending"
                        value={accounting.pendingOrders.toString()}
                        color="text-yellow-600"
                        ocid="accounting.pending.card"
                      />
                      <SummaryCard
                        title="In Delivery"
                        value={accounting.inDeliveryOrders.toString()}
                        color="text-blue-600"
                        ocid="accounting.delivery.card"
                      />
                      <SummaryCard
                        title="Delivered"
                        value={accounting.deliveredOrders.toString()}
                        color="text-green-600"
                        ocid="accounting.delivered.card"
                      />
                      <SummaryCard
                        title="Cancelled"
                        value={accounting.cancelledOrders.toString()}
                        color="text-red-500"
                        ocid="accounting.cancelled.card"
                      />
                    </div>
                    <h3 className="text-lg font-display font-semibold mb-3">
                      Daily Breakdown
                    </h3>
                    {accounting.dailyBreakdown.length === 0 ? (
                      <p
                        className="text-muted-foreground"
                        data-ocid="accounting.daily.empty_state"
                      >
                        No daily data yet.
                      </p>
                    ) : (
                      <div
                        className="overflow-x-auto rounded-xl border"
                        data-ocid="accounting.daily.table"
                      >
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Sales (₹)</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {accounting.dailyBreakdown.map((d, idx) => (
                              <TableRow
                                key={d.date.toString()}
                                data-ocid={`accounting.daily.row.${idx + 1}`}
                              >
                                <TableCell>
                                  {new Date(
                                    Number(d.date) / 1_000_000,
                                  ).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="font-semibold text-primary">
                                  ₹{d.totalSales.toFixed(2)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </>
                ) : (
                  <p
                    className="text-muted-foreground"
                    data-ocid="accounting.error_state"
                  >
                    Unable to load accounting data.
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </main>
      </div>

      <Dialog open={vegDialog} onOpenChange={setVegDialog}>
        <DialogContent data-ocid="catalog.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editVeg ? "Edit Vegetable" : "Add Vegetable"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleVegSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="veg-name">Name</Label>
              <Input
                id="veg-name"
                value={vegForm.name}
                onChange={(e) =>
                  setVegForm((p) => ({ ...p, name: e.target.value }))
                }
                required
                data-ocid="catalog.name.input"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="veg-unit">Unit</Label>
              <Input
                id="veg-unit"
                value={vegForm.unit}
                onChange={(e) =>
                  setVegForm((p) => ({ ...p, unit: e.target.value }))
                }
                placeholder="kg, bunch, piece..."
                required
                data-ocid="catalog.unit.input"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="veg-price">Price per Unit (₹)</Label>
              <Input
                id="veg-price"
                type="number"
                min="0"
                step="0.01"
                value={vegForm.pricePerUnit}
                onChange={(e) =>
                  setVegForm((p) => ({ ...p, pricePerUnit: e.target.value }))
                }
                required
                data-ocid="catalog.price.input"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="veg-stock">Stock</Label>
              <Input
                id="veg-stock"
                type="number"
                min="0"
                value={vegForm.stock}
                onChange={(e) =>
                  setVegForm((p) => ({ ...p, stock: e.target.value }))
                }
                required
                data-ocid="catalog.stock.input"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setVegDialog(false)}
                data-ocid="catalog.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addVeg.isPending || updateVeg.isPending}
                data-ocid="catalog.save_button"
              >
                {(addVeg.isPending || updateVeg.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editVeg ? "Save Changes" : "Add Vegetable"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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

function SummaryCard({
  title,
  value,
  color = "text-foreground",
  ocid,
}: { title: string; value: string; color?: string; ocid: string }) {
  return (
    <Card className="shadow-card" data-ocid={ocid}>
      <CardHeader className="pb-1 pt-4 px-4">
        <CardTitle className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
