import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import QueryProvider from "@/components/shared/QueryProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ammerli - Premium Water Delivery",
  description: "High-quality water delivery at your fingertips",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
