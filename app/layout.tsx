import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SafaiWatch - Login & Civic Auth",
  description: "Clean Streets. Verified Action. Join your local ward's civic coordination network.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[var(--background)] min-h-screen flex flex-col font-sans text-[var(--on-surface)] antialiased overflow-x-hidden selection:bg-[#85f8c4] selection:text-[#002114]">
        {children}
      </body>
    </html>
  );
}


