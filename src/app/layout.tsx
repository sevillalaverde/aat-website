import type { Metadata } from "next";
import "./globals.css"; // <-- THIS LINE APPLIES ALL STYLING

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
      <body>{children}</body>
    </html>
  );
}