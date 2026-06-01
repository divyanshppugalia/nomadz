import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nomadz · Market Intelligence",
  description: "Mobile out-of-home advertising — UK market intelligence platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
