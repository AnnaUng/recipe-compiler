import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Recipe Compiler",
  description: "Compile recipes from links and photos into easy-to-follow lists.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-zinc-200 dark:border-zinc-800">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Recipe Compiler
            </Link>
            <div className="flex items-center gap-4 text-sm font-medium">
              <Link
                href="/mains"
                className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                Mains
              </Link>
              <Link
                href="/desserts"
                className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                Desserts
              </Link>
              <Link
                href="/import"
                className="rounded-full bg-zinc-900 px-4 py-1.5 text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                Import
              </Link>
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}