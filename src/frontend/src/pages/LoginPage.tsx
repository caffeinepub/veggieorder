import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Leaf, Loader2, ShieldCheck, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useLoginCustomer, useRegisterCustomer } from "../hooks/useQueries";

const ADMIN_USER = "admin";
const ADMIN_PASS = "admin123";

export default function LoginPage() {
  const { loginAdmin, loginCustomer } = useAuth();

  // Admin form
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");

  // Customer form
  const [isRegister, setIsRegister] = useState(false);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custPass, setCustPass] = useState("");

  const loginMut = useLoginCustomer();
  const registerMut = useRegisterCustomer();

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUser === ADMIN_USER && adminPass === ADMIN_PASS) {
      loginAdmin();
      toast.success("Welcome back, Admin!");
    } else {
      toast.error("Invalid admin credentials.");
    }
  };

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = await loginMut.mutateAsync({
        phone: custPhone,
        password: custPass,
      });
      loginCustomer(id, custPhone);
      toast.success("Logged in successfully!");
    } catch {
      toast.error("Login failed. Check your phone & password.");
    }
  };

  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = await registerMut.mutateAsync({
        name: custName,
        phone: custPhone,
        password: custPass,
      });
      loginCustomer(id, custName);
      toast.success(`Welcome, ${custName}!`);
    } catch {
      toast.error("Registration failed. Phone may already be in use.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Hero panel */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden md:flex flex-col justify-center items-center bg-primary text-primary-foreground w-1/2 p-12 relative overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 40%, white 1px, transparent 1px), radial-gradient(circle at 70% 80%, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <Leaf className="w-16 h-16 mb-6 opacity-90" />
        <h1 className="text-5xl font-display font-bold text-center leading-tight mb-4">
          Fresh Veggie
          <br />
          Market
        </h1>
        <p className="text-lg text-center opacity-80 max-w-xs">
          Farm-fresh vegetables delivered to your doorstep. Order online,
          receive freshness.
        </p>
        <img
          src="/assets/generated/veggies-hero.dim_600x400.png"
          alt="Fresh vegetables"
          className="mt-8 rounded-2xl shadow-2xl max-w-xs opacity-90 object-cover"
        />
      </motion.div>

      {/* Login panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex-1 flex flex-col justify-center items-center p-6 md:p-12"
      >
        <div className="md:hidden flex items-center gap-2 mb-8">
          <Leaf className="w-8 h-8 text-primary" />
          <span className="text-2xl font-display font-bold text-primary">
            Fresh Veggie Market
          </span>
        </div>

        <div className="w-full max-w-md">
          <Tabs defaultValue="customer">
            <TabsList className="grid grid-cols-2 mb-6 w-full">
              <TabsTrigger value="customer" data-ocid="login.customer.tab">
                <User className="w-4 h-4 mr-2" /> Customer
              </TabsTrigger>
              <TabsTrigger value="admin" data-ocid="login.admin.tab">
                <ShieldCheck className="w-4 h-4 mr-2" /> Admin
              </TabsTrigger>
            </TabsList>

            {/* Customer tab */}
            <TabsContent value="customer">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="font-display text-2xl">
                    {isRegister ? "Create Account" : "Customer Login"}
                  </CardTitle>
                  <CardDescription>
                    {isRegister
                      ? "Join us to start ordering fresh vegetables"
                      : "Welcome back! Sign in to continue"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={
                      isRegister ? handleCustomerRegister : handleCustomerLogin
                    }
                    className="space-y-4"
                  >
                    {isRegister && (
                      <div className="space-y-2">
                        <Label htmlFor="cust-name">Full Name</Label>
                        <Input
                          id="cust-name"
                          placeholder="Your name"
                          value={custName}
                          onChange={(e) => setCustName(e.target.value)}
                          required
                          data-ocid="customer.name.input"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="cust-phone">Phone Number</Label>
                      <Input
                        id="cust-phone"
                        placeholder="10-digit phone"
                        value={custPhone}
                        onChange={(e) => setCustPhone(e.target.value)}
                        required
                        type="tel"
                        data-ocid="customer.phone.input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cust-pass">Password</Label>
                      <Input
                        id="cust-pass"
                        type="password"
                        placeholder="Your password"
                        value={custPass}
                        onChange={(e) => setCustPass(e.target.value)}
                        required
                        data-ocid="customer.password.input"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMut.isPending || registerMut.isPending}
                      data-ocid="customer.submit_button"
                    >
                      {(loginMut.isPending || registerMut.isPending) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {isRegister ? "Create Account" : "Sign In"}
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                      {isRegister
                        ? "Already have an account?"
                        : "New customer?"}{" "}
                      <button
                        type="button"
                        onClick={() => setIsRegister(!isRegister)}
                        className="text-primary font-semibold hover:underline"
                        data-ocid="customer.toggle.button"
                      >
                        {isRegister ? "Sign In" : "Register"}
                      </button>
                    </p>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Admin tab */}
            <TabsContent value="admin">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="font-display text-2xl">
                    Admin Login
                  </CardTitle>
                  <CardDescription>
                    Manage orders, catalog & accounting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-user">Username</Label>
                      <Input
                        id="admin-user"
                        placeholder="admin"
                        value={adminUser}
                        onChange={(e) => setAdminUser(e.target.value)}
                        required
                        data-ocid="admin.username.input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-pass">Password</Label>
                      <Input
                        id="admin-pass"
                        type="password"
                        placeholder="Password"
                        value={adminPass}
                        onChange={(e) => setAdminPass(e.target.value)}
                        required
                        data-ocid="admin.password.input"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      data-ocid="admin.submit_button"
                    >
                      <ShieldCheck className="mr-2 h-4 w-4" /> Sign In as Admin
                    </Button>
                    <p className="text-center text-xs text-muted-foreground mt-2">
                      Default: admin / admin123
                    </p>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
}
