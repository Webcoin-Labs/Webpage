import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const base = "https://webcoinlabs.com";

    const routes = [
        "",
        "/build",
        "/ecosystems",
        "/network",
        "/case-studies",
        "/insights",
        "/contact",
        "/webcoin-labs-2-0",
    ];

    return routes.map((route) => ({
        url: `${base}${route}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: route === "" ? 1 : 0.8,
    }));
}
