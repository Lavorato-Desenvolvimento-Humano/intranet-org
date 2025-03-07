import "../styles/globals.css";
import { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lavorato",
  description: "Sistema de gestão empresarial",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
    shortcut: "/icon.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
