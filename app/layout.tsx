import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ProjectOCR — แปลงรูปเป็นข้อความ OCR ภาษาไทยและอังกฤษ",
    template: "%s | ProjectOCR",
  },
  description: "เครื่องมือ OCR ออนไลน์ฟรี แปลงรูปภาพ PNG และ JPG เป็นข้อความภาษาไทยหรืออังกฤษ แก้ไข คัดลอก และบันทึกได้ทันที ประมวลผลภายในเบราว์เซอร์",
  applicationName: "ProjectOCR",
  keywords: ["OCR ภาษาไทย", "แปลงรูปเป็นข้อความ", "อ่านข้อความจากรูป", "Image to Text", "Thai OCR", "OCR online", "ดึงข้อความจากภาพ"],
  authors: [{ name: "ProjectOCR" }],
  creator: "ProjectOCR",
  publisher: "ProjectOCR",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  openGraph: {
    type: "website",
    locale: "th_TH",
    alternateLocale: "en_US",
    url: "/",
    siteName: "ProjectOCR",
    title: "ProjectOCR — แปลงรูปเป็นข้อความ OCR ภาษาไทยและอังกฤษ",
    description: "อ่านข้อความจากรูปภาพได้ทันที รองรับภาษาไทยและอังกฤษ พร้อมแก้ไข คัดลอก และบันทึกผลลัพธ์",
  },
  twitter: { card: "summary", title: "ProjectOCR — OCR ภาษาไทยและอังกฤษ", description: "แปลงรูปภาพเป็นข้อความได้ง่ายและเป็นส่วนตัว" },
  category: "technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
