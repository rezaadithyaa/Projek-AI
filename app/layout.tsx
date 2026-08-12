import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Perencana Tugas AI - Penjadwalan AI Otomatis",
  description: "Biarkan AI menyusun jadwal harian Anda secara otomatis dengan Constraint Programming.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-[#f4f5f7] text-[#18181b] font-sans selection:bg-indigo-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
