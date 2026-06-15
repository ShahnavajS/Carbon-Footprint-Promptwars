import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: {
    default: "EcoScore – Track & Reduce Your Carbon Footprint",
    template: "%s | EcoScore",
  },
  description:
    "EcoScore helps you understand, track, and reduce your personal carbon footprint through simple actions, habit building, gamification, and AI-powered insights.",
  keywords: [
    "carbon footprint",
    "sustainability",
    "climate",
    "green habits",
    "eco tracker",
    "carbon score",
  ],
  authors: [{ name: "EcoScore Team" }],
  creator: "EcoScore",
  metadataBase: new URL("https://ecoscore.app"),
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ecoscore.app",
    title: "EcoScore – Track & Reduce Your Carbon Footprint",
    description:
      "Track your carbon footprint and build sustainable habits with AI-powered insights.",
    siteName: "EcoScore",
  },
  twitter: {
    card: "summary_large_image",
    title: "EcoScore – Track & Reduce Your Carbon Footprint",
    description:
      "Track your carbon footprint and build sustainable habits with AI-powered insights.",
    creator: "@ecoscore",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white font-sans antialiased dark:bg-slate-950">
        <Providers>
          <div id="app-root">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-emerald-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:outline-none"
            >
              Skip to main content
            </a>
            <main id="main-content" tabIndex={-1}>
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
