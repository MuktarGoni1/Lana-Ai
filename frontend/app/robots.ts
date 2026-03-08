import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/homepage",
          "/learn",
          "/term-plan",
          "/onboarding",
          "/profile",
          "/settings",
          "/dashboard",
          "/auth/",
          "/api/",
        ],
      },
    ],
    host: "https://lanamind.com",
    sitemap: "https://lanamind.com/sitemap.xml",
  };
}
