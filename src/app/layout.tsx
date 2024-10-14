import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Importing Inter from Google Fonts
import "./globals.css";

// Load the Inter font from Google Fonts
const inter = Inter({
  subsets: ["latin"], // Specify the subset for better optimization
  variable: "--font-inter", // Define a custom CSS variable for the Inter font
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"], // Optional: Specify the font weights
});

export const metadata: Metadata = {
  title: "Upstash Newsletter",
  description: "A project to showcase the capabilities of Upstash Workflow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
