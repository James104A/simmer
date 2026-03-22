import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Simmer",
  description: "Hello world",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
