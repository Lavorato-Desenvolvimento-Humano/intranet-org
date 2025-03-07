// app/auth/register/page.tsx
"use client";
import Header from "@/components/layout/header";
import { useState } from "react";
import { useViewport } from "@/hooks/useViewport";
import {
  MobileRegisterLayout,
  DesktopRegisterLayout,
} from "@/components/layout/auth/register/layout";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const viewport = useViewport();
  const isMobile = viewport === "mobile";

  return (
    <div className="min-h-screen flex flex-col bg-primary-light">
      {/* Header só aparece no modo mobile */}
      {isMobile && <Header />}

      {/* Estrutura principal - tela cheia no desktop, centralizado no mobile */}
      {isMobile ? (
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <MobileRegisterLayout
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />
        </main>
      ) : (
        <DesktopRegisterLayout
          showPassword={showPassword}
          setShowPassword={setShowPassword}
        />
      )}
    </div>
  );
}
