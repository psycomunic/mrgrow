import type { MetadataRoute } from "next";
import { MARCA } from "@/lib/marca";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: MARCA.site, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${MARCA.site}/entrar`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];
}
