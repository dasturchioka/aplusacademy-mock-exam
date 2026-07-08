import Image from "next/image";
import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({
  children,
  title,
  subtitle,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center flex-col bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 flex items-center justify-center flex-col">
        <div className="flex flex-col items-center justify-center">
          <Image
            width={90}
            height={90}
            src="/images/og-image.png"
            alt="The Aplus Academy, Aplus Academy, uzbekistan, urgench, khorezm"
          />
        </div>

        {children}
      </div>
    </div>
  );
}
