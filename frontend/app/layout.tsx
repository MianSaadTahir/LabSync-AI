import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SocketStatusProvider } from "./components/SocketStatusProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LabSync AI",
  description:
    "Telegram-powered client intake dashboard for capturing and displaying incoming bot messages.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-slate-50 antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
              <Link href="/" className="text-lg font-semibold text-slate-900">
                LabSync AI
              </Link>
              <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
                <Link href="/" className="hover:text-slate-900">
                  Home
                </Link>
                <Link href="/messages" className="hover:text-slate-900">
                  Messages
                </Link>
                <Link href="/meetings" className="hover:text-slate-900">
                  Meetings
                </Link>
                <Link href="/budgets" className="hover:text-slate-900">
                  Budgets
                </Link>
                <Link href="/allocations" className="hover:text-slate-900">
                  Allocations
                </Link>
                <SocketStatusProvider />
              </nav>
            </div>
          </header>
          <div className="flex-1">{children}</div>
          <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
            © 2025 LabSync AI — All Rights Reserved
          </footer>
        </div>
      </body>
    </html>
  );
}
