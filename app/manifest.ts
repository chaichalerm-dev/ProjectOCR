import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ProjectOCR — Thai & English Image to Text",
    short_name: "ProjectOCR",
    description: "อ่านข้อความภาษาไทยและอังกฤษจากรูปภาพ",
    start_url: "/",
    display: "standalone",
    background_color: "#f8faff",
    theme_color: "#6d28d9",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
