import type { MetadataRoute } from "next";
import { MARCA } from "@/lib/marca";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/painel", "/portal", "/api"] }],
    sitemap: `${MARCA.site}/sitemap.xml`,
  };
}
