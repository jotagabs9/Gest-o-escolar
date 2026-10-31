import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Gestão Escolar",
  description: "Sistema de gestão escolar multi-tenant",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
