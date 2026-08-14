import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const host =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://caresync-india.vercel.app");

  const baseUrl = host.startsWith("http") ? host : `https://${host}`;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
