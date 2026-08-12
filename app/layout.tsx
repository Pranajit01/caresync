import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CareSync — Connected Care. Better Health.",
  description:
    "Real-time smart OPD queue tracking and emergency hospital bed finder in Kolkata.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-zinc-50 text-zinc-900 selection:bg-red-100 selection:text-[#E63946]">
        {children}
      </body>
    </html>
  );
}
