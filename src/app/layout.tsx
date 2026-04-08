import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tekkipodi",
  description: "Podcast notes and ideas",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#161616",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fi" className={`${inter.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-deep-charcoal text-silver-mist">
        <main className="flex-1 w-full max-w-lg mx-auto pb-16">
          {children}
        </main>
      </body>
    </html>
  );
}
