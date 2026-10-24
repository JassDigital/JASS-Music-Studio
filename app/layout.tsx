import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JASS Music Studio",
  description: "Create, collect, and play original music with JASS Music Studio.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
