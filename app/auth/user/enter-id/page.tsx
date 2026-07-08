"use client";

import AuthLayout from "@/app/layouts/AuthLayout";
import { PageState } from "@/components/ui/page-state";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function EnterIDRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/student/login");
  }, [router]);

  return (
    <AuthLayout
      title="Student Sign In"
      subtitle="Redirecting to the student login page."
    >
      <PageState type="loading" title="Redirecting to student sign in" />
    </AuthLayout>
  );
}
