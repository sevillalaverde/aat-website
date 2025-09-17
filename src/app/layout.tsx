import type { Metadata } from "next";
import "./globals.css";

// This is the default metadata for your site
export const metadata: Metadata = {
  title: "The American AI Token",
  description: "The American AI Aggregator for Investors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* We have removed the font variables from the body tag */}
      <body>{children}</body>
    </html>
  );
}