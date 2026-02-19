import type { Metadata } from "next";
import Link from "next/link";

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
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <nav
          style={{
            display: "flex",
            gap: "1.5rem",
            padding: "1rem 2rem",
            background: "#111",
            color: "#fff",
          }}
        >
          <Link
            href="/"
            style={{ color: "#fff", textDecoration: "none", fontWeight: 700 }}
          >
            🧠 Mind Stack
          </Link>
          <Link
            href="/documents"
            style={{ color: "#ccc", textDecoration: "none" }}
          >
            Documents
          </Link>
          <Link
            href="/review"
            style={{ color: "#ccc", textDecoration: "none" }}
          >
            Daily Review
          </Link>
          <Link href="/graph" style={{ color: "#ccc", textDecoration: "none" }}>
            Graph
          </Link>
        </nav>
        <main style={{ padding: "2rem" }}>{children}</main>
      </body>
    </html>
  );
}
