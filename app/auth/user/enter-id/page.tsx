"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultInstance as axios } from "@/http/index";
import { ApprovalResponse } from "@/types/db";
import { setUserSession } from "@/utils/checkAuth";
import { Loader2 } from "lucide-react";
import { Figtree } from "next/font/google";
import Image from "next/image";
import { useState } from "react";

const figtree = Figtree({ subsets: ["latin"] });

export default function EnterIDPage() {
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate ID format (8 digits)
    if (!/^\d{8}$/.test(id)) {
      setError("Please enter a valid 8-digit ID");
      setLoading(false);
      return;
    }

    try {
      // Check if user exists and request approval
      const response = await axios.post(
        "/api/users/send-approval",
        {
          studentId: id,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            // You can optionally add these if required by the server:
            // 'Authorization': 'Bearer YOUR_TOKEN_HERE',
            // 'Origin': 'https://your-frontend-domain.com' (but usually not needed manually)
          },
          withCredentials: true,
        }
      );

      const data: ApprovalResponse = response.data;

      if (data.approved) {
        // User is already approved, set session and redirect
        setUserSession({
          id: id,
          fullName: "", // We'll fetch this later
          email: "",
          approved: true,
        });
        window.location.href = "/exam/start";
      } else {
        // User needs approval, set session and redirect to queue
        setUserSession({
          id: id,
          fullName: "",
          email: "",
          approved: false,
        });
        window.location.href = "/auth/user/queue";
      }
    } catch (error: any) {
      console.error("Error:", error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center flex-col p-4">
      <Image
        className="mb-10"
        width={90}
        height={90}
        src="/images/logo-transparent-without-text.png"
        alt="The Aplusacademy, Aplusacademy, uzbekistan, urgench, khorezm"
      />
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            IELTS Mock Exam
          </h1>
          <p className="text-gray-600">by <b className="text-primary">Aplusacademy</b></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="id" className="text-sm font-medium text-gray-700">
              Student ID
            </Label>
            <Input
              id="id"
              type="text"
              placeholder="12345678"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="mt-1 text-center text-lg font-mono"
              maxLength={8}
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={loading || id.length !== 8}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Enter Exam"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Don't have an ID? Contact your administrator.</p>
        </div>
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
    </div>
  );
}
