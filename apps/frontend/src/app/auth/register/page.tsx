// app/auth/register/page.tsx
"use client";
import Header from "@/components/layout/header";
import { useState } from "react";
import { useViewport } from "@/hooks/useViewport";
import {
  MobileRegisterLayout,
  DesktopRegisterLayout,
} from "@/components/layout/auth/register/layout";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const viewport = useViewport();
  const isMobile = viewport === "mobile";
  const { register } = useAuth(); // Removido error e clearError

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await register({ fullName, email, password, confirmPassword });
    } finally {
      setIsSubmitting(false);
    }
  };

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
            fullName={fullName}
            setFullName={setFullName}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            handleSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </main>
      ) : (
        <DesktopRegisterLayout
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          fullName={fullName}
          setFullName={setFullName}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
