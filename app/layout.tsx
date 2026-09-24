import type { Metadata, Viewport } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bunny Training",
  description: "Your daily workout, made just for you.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Bunny Training" },
};

export const viewport: Viewport = {
  themeColor: "#f85497",
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${quicksand.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-10 pt-6">
          {children}
        </div>
      </body>
    </html>
  );
}
