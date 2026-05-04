import Link from "next/link";
import { ReactNode } from "react";

const navigation = [
  { label: "Dashboard", href: "/" },
  { label: "Trips", href: "/trips" },
  { label: "Queue", href: "/queue" },
  { label: "Reports", href: "/reports" },
  { label: "Travelers", href: "/travelers" },
  { label: "Settings", href: "/settings" },
];

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-page lg:grid lg:grid-cols-[224px_1fr]">
      <aside className="border-b border-border bg-white/92 px-4 py-3 backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-ink text-sm font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]">
            M
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Mentat</p>
            <p className="text-xs text-muted">Travel optimization</p>
          </div>
        </div>

        <nav className="mt-5 flex gap-1 overflow-x-auto text-sm text-steel lg:block lg:space-y-1 lg:overflow-visible">
          {navigation.map((item) => (
            <Link
              key={item.href}
              className="block shrink-0 rounded px-3 py-2 font-medium hover:bg-ink hover:text-white"
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-6 hidden rounded-md border border-border bg-cloud p-3 lg:block">
          <p className="eyebrow">Workspace</p>
          <p className="mt-2 text-sm font-semibold text-ink">Visual prototype</p>
          <p className="mt-1 text-xs leading-5 text-muted">Auth and role controls are mocked for this build.</p>
        </div>

        <Link className="mt-3 hidden text-xs font-medium text-muted hover:text-ink lg:block" href="/login">
          Back to login
        </Link>
      </aside>

      <main className="min-w-0 px-5 py-5">{children}</main>
    </div>
  );
}
