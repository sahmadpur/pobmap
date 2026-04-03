import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Baku Port Interactive Transport Corridors",
  description:
    "Interactive presentation map for Azerbaijan's strategic transport corridors with multilingual route storytelling.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="az"
      data-theme="dark"
      suppressHydrationWarning
      className={`${roboto.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
