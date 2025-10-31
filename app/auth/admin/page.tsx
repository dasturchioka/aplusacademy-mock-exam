"use client";

import AuthLayout from "@/app/layouts/AuthLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultInstance as axios } from "@/http/index";
import { AdminSession } from "@/types/db";
import { Figtree } from "next/font/google";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const figtree = Figtree({ subsets: ["latin"] });


export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if already logged in
    const adminSession = sessionStorage.getItem("adminSession");
    if (adminSession) {
      try {
        const session: AdminSession = JSON.parse(adminSession);
        if (session.authenticated) {
          router.push("/admin");
        }
      } catch (error) {
        // Invalid session data, clear it
        sessionStorage.removeItem("adminSession");
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post("/api/admin/login", {
        email,
        password,
      });

      if (response.data.success) {
        // Store admin session
        const adminSession: AdminSession = {
          id: response.data.admin.id,
          role: "admin",
          authenticated: true,
        };

        sessionStorage.setItem("adminSession", JSON.stringify(adminSession));
        sessionStorage.setItem("isAdminLoggedIn", "true"); // Keep for backward compatibility

        router.push("/admin");
      } else {
        setError(response.data.message || "Invalid credentials");
      }
    } catch (error: any) {
      console.error("Admin login error:", error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Admin Login"
      subtitle="Enter your credentials to access the admin panel"
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center">Admin Access</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="transition-all mt-4">
        <p className={`${figtree.className} z-50`}>
          made by{" "}
          <a
            className="underline"
            target="_blank"
            href="https://dasturchioka.uz"
          >
            <span className="text-blue-500">@</span>dasturchioka
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}
