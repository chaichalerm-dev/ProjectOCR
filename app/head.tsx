import { headers } from "next/headers";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function Head() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ProjectOCR",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    url: siteUrl,
    inLanguage: ["th", "en"],
    description: "เครื่องมืออ่านข้อความภาษาไทยและอังกฤษจากรูปภาพภายในเว็บเบราว์เซอร์",
    offers: { "@type": "Offer", price: "0", priceCurrency: "THB" },
    featureList: ["Thai OCR", "English OCR", "Image to text", "Client-side image processing"],
  };

  return (
    <>
      <script
        nonce={nonce}
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
