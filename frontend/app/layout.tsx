import type { Metadata } from "next";
import { ReactNode } from "react";
import { SessionGate } from "@/components/session-gate";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mentat",
  description: "AI-powered corporate travel planning and policy optimization dashboard",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SessionGate>{children}</SessionGate>
      </body>
    </html>
  );
}
