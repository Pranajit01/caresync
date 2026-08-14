import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://caresync-india.vercel.app";
};

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  title: "CareSync India — Real-Time Smart OPD & Emergency Healthcare",
  description:
    "CareSync India connects patients directly with live doctor OPD queues and emergency hospital bed availability in real time across India — reducing wait times and saving lives.",
  keywords: [
    "CareSync India",
    "CareSync",
    "Kersink India",
    "Kersink",
    "Care Sync India",
    "Real-Time OPD Queue Tracking India",
    "Emergency Bed Availability India",
    "Smart Healthcare India",
    "Hospital Queue Management India",
    "Doctor OPD Booking",
  ],
  authors: [{ name: "CareSync India Team" }],
  creator: "CareSync India",
  publisher: "CareSync India",
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "MbPbGnGz548mjQVADHX0PLAPY3eNBDP0LZLlAKl18aI",
  },
  openGraph: {
    title: "CareSync India — Connected Care. Better Health.",
    description:
      "Real-time OPD queue status tracking and emergency ICU & hospital bed finder in India.",
    url: baseUrl,
    siteName: "CareSync India",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CareSync India — Connected Care. Better Health.",
    description:
      "Real-time OPD queue status tracking and emergency ICU & hospital bed finder in India.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebApplication",
    name: "CareSync India",
    alternateName: ["Kersink India", "Care Sync India", "CareSync Healthcare"],
    url: baseUrl,
    description:
      "Real-time OPD queue status tracking and emergency hospital bed finder across hospitals in India.",
    applicationCategory: "HealthApplication",
    operatingSystem: "All",
    areaServed: "IN",
    publisher: {
      "@type": "Organization",
      name: "CareSync India",
      alternateName: "Kersink India",
      url: baseUrl,
    },
  };

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-zinc-50 text-zinc-900 selection:bg-red-100 selection:text-[#E63946]">
        {children}
      </body>
    </html>
  );
}
