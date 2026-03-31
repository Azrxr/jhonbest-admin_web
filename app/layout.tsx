import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthWrapper } from "@/components/AuthWrapper";
import { Navbar } from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jhonbest Panel",
  description: "Admin panel for Jhonbest Gaming. Manage buttons and administrators.",
  icons: {
    icon: "/ic_brand.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen pb-safe`}
      >
        <AuthWrapper>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
              {children}
            </main>
          </div>
        </AuthWrapper>
      </body>
    </html>
  );
}
