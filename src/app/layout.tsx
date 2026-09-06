import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site-header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const description =
  "Paste a GitHub repo URL to browse its releases and commits, see analysis for any version, and ask questions about the code with RAG-powered chat.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "RepoLens",
    template: "%s · RepoLens",
  },
  description,
  keywords: ["GitHub", "repository", "code analysis", "RAG", "AI chat", "developer tools"],
  openGraph: {
    title: "RepoLens",
    description,
    siteName: "RepoLens",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RepoLens",
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SiteHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
