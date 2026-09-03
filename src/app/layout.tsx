import "./globals.css";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import QueryProvider from "@/components/providers/QueryProvider";
import { ClerkProvider } from "@clerk/nextjs";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Followup Agent",
  description: "AI Followup Agent",
};

import { NotificationProvider } from "@/context/NotificationContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${poppins.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col font-sans bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
          <QueryProvider>
            <NotificationProvider>
              <div className="flex-1">{children}</div>
            </NotificationProvider>
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
