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
    <html lang="en" className="h-full overflow-hidden">
      <body className="flex h-full flex-col overflow-hidden">
        <Header />
        <div className="content-scroll flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="flex-1">{children}</div>
          <Footer />
        </div>
        <AnimatedLogo />
      </body>
      <GoogleAnalytics gaId="G-0K4Z4DX9HZ" />
    </html>
  );
}
