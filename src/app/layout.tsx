import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AURA SYSTEM | Gestão Escolar",
    template: "%s | AURA SYSTEM",
  },
  description: "AURA SYSTEM — plataforma de gestão escolar para instituições de ensino.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
