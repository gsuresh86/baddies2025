'use client';

// Removed export of metadata due to client component restriction
// import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from '@/components/layouts/ClientLayout';
import { Analytics } from '@vercel/analytics/next';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>
          {children}
        </ClientLayout>
        <Analytics />
      </body>
    </html>
  );
}
