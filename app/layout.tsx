import type { Metadata } from "next";
import "./globals.css";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AnimatedLogo } from "./AnimatedLogo";
import { GoogleAnalytics } from "@next/third-parties/google";

export const metadata: Metadata = {
  title: "UN Document Diff Viewer",
  description: "Compare and diff UN documents with highlighted changes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
        <AnimatedLogo />
      </body>
      <GoogleAnalytics gaId="G-0K4Z4DX9HZ" />
    </html>
  );
}
