"use client";

import { usePathname } from "next/navigation";

/** Short compositor-only enter so tab changes feel like a native 120 Hz push. */
export function PageMotion({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-motion">
      {children}
    </div>
  );
}
