import "../styles/globals.css";
import { Inter } from "next/font/google";
import { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import ToastProvider from "@/providers/ToastProvider";
import { FloatingSupportWidget } from "@/components/layout/FloatingSupportWidget";
import BrowserNotificationListener from "@/components/tickets/BrowserNotificationListener";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lavorato",
  description:
    "Portal organizacional para profissionais da clínica multidisciplinar",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
    shortcut: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <BrowserNotificationListener />
          <ToastProvider>{children}</ToastProvider>
          <FloatingSupportWidget />
        </AuthProvider>
      </body>
    </html>
  );
}
