import React from "react";
import Navbar from "@/components/layout/Navbar";

export default function TicketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main>{children}</main>
    </div>
  );
}
