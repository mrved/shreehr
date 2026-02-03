import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShreeHR - HR Management System",
  description: "Automated payroll with Indian statutory compliance",
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
