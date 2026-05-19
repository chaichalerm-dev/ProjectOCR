import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProjectOCR",
  description: "Extract text from images using OCR powered by Tesseract.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
