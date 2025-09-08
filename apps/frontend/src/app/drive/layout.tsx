"use client";

import React from "react";
import { DriveAuthProvider } from "@/context/DriveAuthContext";

interface DriveLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout específico para páginas do Drive
 * Fornece o contexto de autenticação do Drive
 */
export default function DriveLayout({ children }: DriveLayoutProps) {
  return <DriveAuthProvider>{children}</DriveAuthProvider>;
}
