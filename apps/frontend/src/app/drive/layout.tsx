"use client";

import React from "react";
import { DriveAuthProvider } from "@/context/DriveAuthContext";
// import DriveNavbar from "@/components/drive/layout/DriveNavbar";
// import DriveSidebar from "@/components/drive/layout/DriveSidebar";
import DriveProtectedRoute from "@/components/auth/DriveProtectedRoute";

interface DriveLayoutProps {
  children: React.ReactNode;
}

export default function DriveLayout({ children }: DriveLayoutProps) {
  return (
    <DriveAuthProvider>
      <DriveLayoutContent>{children}</DriveLayoutContent>
    </DriveAuthProvider>
  );
}

function DriveLayoutContent({ children }: DriveLayoutProps) {
  return (
    <DriveProtectedRoute>
      <div className="h-screen bg-gray-50 flex overflow-hidden">
        {/* Sidebar */}
        {/* <DriveSidebar /> */}

        {/* Conteúdo principal */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Navbar */}
          {/* <DriveNavbar /> */}

          {/* Área de conteúdo */}
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </DriveProtectedRoute>
  );
}
