import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LSK Ranking - Ranking Kolarski",
  description: "Ranking kolarski oparty na danych ze Stravy",
  openGraph: {
    title: "LSK Ranking - Ranking Kolarski",
    description: "Ranking kolarski oparty na danych ze Stravy",
    siteName: "LSK Ranking",
    locale: "pl_PL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LSK Ranking - Ranking Kolarski",
    description: "Ranking kolarski oparty na danych ze Stravy",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
