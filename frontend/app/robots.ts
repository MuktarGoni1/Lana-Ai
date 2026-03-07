import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/dashboard/",
          "/homepage",
          "/learn",
          "/term-plan",
          "/settings",
        ],
      },
    ],
    sitemap: "https://lanamind.com/sitemap.xml",
  };
}
