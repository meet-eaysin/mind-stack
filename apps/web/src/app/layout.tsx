import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Mind Stack - Second Brain",
  description: "Personal knowledge management system for software engineers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white min-h-screen selection:bg-blue-500/30 selection:text-blue-200">
        <Providers>
          <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-8">
                  <Link
                    href="/"
                    className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
                  >
                    🧠 Mind Stack
                  </Link>
                  <div className="hidden md:flex items-center gap-4">
                    <NavLink href="/search">Search</NavLink>
                    <NavLink href="/documents">Documents</NavLink>
                    <NavLink href="/review">Daily Review</NavLink>
                    <NavLink href="/graph">Graph</NavLink>
                  </div>
                </div>
              </div>
            </div>
          </nav>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-gray-400 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-gray-800"
    >
      {children}
    </Link>
  );
}
