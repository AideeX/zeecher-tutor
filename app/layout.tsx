import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Learning Coach Nigeria",
  description: "A calm, personal learning space for growing minds.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG">
      <body>{children}</body>
    </html>
  );
}
