"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const publicPaths = new Set(["/login", "/signup", "/signup/company"]);

export function SessionGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(publicPaths.has(pathname));

  useEffect(() => {
    if (publicPaths.has(pathname)) {
      setAllowed(true);
      return;
    }

    const session = window.localStorage.getItem("mentat_session");
    if (!session) {
      router.replace("/login");
      return;
    }

    setAllowed(true);
  }, [pathname, router]);

  if (!allowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-page px-5 py-10">
        <div className="section-card p-5 text-sm text-steel">Checking workspace access...</div>
      </main>
    );
  }

  return children;
}
