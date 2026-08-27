/** Money is stored as integer paise so arithmetic never drifts. */
export function toPaise(input: string | number): number {
  const n = typeof input === "number" ? input : Number.parseFloat(input.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100);
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrExact = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ₹1,24,500 — rounded, for tiles and axes. */
export function money(paise: number): string {
  return inr.format(paise / 100);
}

/** ₹1,24,500.00 — exact, for rows the user might reconcile. */
export function moneyExact(paise: number): string {
  return inrExact.format(paise / 100);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function todayISO(): string {
  return new Date().toLocaleDateString("en-CA");
}

/** "2026-08" for the month a date string falls in. */
export function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

export function monthLabel(month: string, opts: { long?: boolean } = {}): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", {
    month: opts.long ? "long" : "short",
    year: opts.long ? "numeric" : "2-digit",
  });
}

export function dayLabel(iso: string): string {
  const today = todayISO();
  if (iso === today) return "Today";
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (iso === y.toLocaleDateString("en-CA")) return "Yesterday";
  const [yy, mm, dd] = iso.split("-").map(Number);
  return new Date(yy, mm - 1, dd).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
