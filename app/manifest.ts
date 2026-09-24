import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bunny Training",
    short_name: "Bunny",
    description: "Your daily workout, made just for you.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff5f9",
    theme_color: "#f85497",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
