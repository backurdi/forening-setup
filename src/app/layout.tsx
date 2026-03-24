import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Forening Setup",
  description: "Membership platform scaffold for unions and organizations."
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
