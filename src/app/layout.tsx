import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://trustforge.trustroutetechnologies.com"),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "TrustForge",
    url: "https://trustforge.trustroutetechnologies.com",
  },
  title: {
    default: "TrustForge: FLEXCUBE customizations, forged in conversation",
    template: "%s · TrustForge",
  },
  description:
    "TrustForge builds Oracle FLEXCUBE UBS 14.6 and 14.7 ODT customizations from a conversation: radxml, hook packages, JS and scripts, ready to load in ODT.",
  applicationName: "TrustForge",
  authors: [{ name: "TrustRoute Technologies", url: "https://trustroutetechnologies.com" }],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${geist.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
