import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Concurrentie-analyse tool | Newfound Agency",
  description: "Ontdek hoe je je onderscheidt van je concurrenten in 2 minuten. Gratis analyse, geen registratie nodig.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
