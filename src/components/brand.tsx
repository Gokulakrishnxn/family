import { cn } from "@/lib/utils";

/**
 * The Family mark: a household of four dots inside a rounded square.
 * Drawn in currentColor so it inverts cleanly with the theme.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-7", className)} fill="none">
      <rect x="1" y="1" width="30" height="30" rx="9" className="fill-foreground" />
      <circle cx="11" cy="12" r="3.4" className="fill-background" />
      <circle cx="21" cy="12" r="3.4" className="fill-background" />
      <circle cx="11" cy="21.5" r="2.4" className="fill-background" />
      <circle cx="21" cy="21.5" r="2.4" className="fill-background" />
    </svg>
  );
}

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <BrandMark />
      <span className="text-lg font-semibold tracking-tight">Family</span>
    </span>
  );
}
