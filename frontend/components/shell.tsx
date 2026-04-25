import Link from "next/link";
import { ReactNode } from "react";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-black/10 bg-white/75 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-steel">Northstar Travel Ops</p>
            <h1 className="text-2xl font-semibold">Corporate Travel Optimizer</h1>
          </div>
          <nav className="flex gap-3 text-sm text-steel">
            <Link className="rounded-full border border-black/10 px-4 py-2 hover:bg-white" href="/">
              Dashboard
            </Link>
            <Link className="rounded-full border border-black/10 px-4 py-2 hover:bg-white" href="/trips">
              Trips
            </Link>
            <Link className="rounded-full border border-black/10 px-4 py-2 hover:bg-white" href="/admin">
              Admin
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
