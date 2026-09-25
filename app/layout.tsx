import type { Metadata } from "next";
import { Newsreader, Geist, Geist_Mono } from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";

const serif = Newsreader({ subsets: ["latin"], variable: "--font-newsreader", style: ["normal", "italic"] });
const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Callwitness: verifiable records of AI agent tool interactions",
  description:
    "An open-source recorder for AI agents. Forwards every byte, blocks nothing, and hash-chains every tool call so the record can be verified.",
  metadataBase: new URL("https://callwitness.tech"),
  openGraph: { title: "Callwitness", description: "Every action, on the record.", url: "https://callwitness.tech" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body className="bg-paper text-ink">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
