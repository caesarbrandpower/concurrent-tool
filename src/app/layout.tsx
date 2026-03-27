import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Concurrent Analyse Tool | Newfound Agency",
  description: "Ontdek hoe jouw merk zich verhoudt tot concurrenten. Een eerlijke analyse in gewone taal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
