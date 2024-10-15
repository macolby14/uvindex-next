import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UVIndex Forecast",
  description: "App to get the daily UVIndex forecast",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
