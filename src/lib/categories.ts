import {
  ShoppingCart,
  UtensilsCrossed,
  Bus,
  Zap,
  Home,
  HeartPulse,
  GraduationCap,
  Shirt,
  Clapperboard,
  Gift,
  Smartphone,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

export type CategoryId =
  | "groceries"
  | "dining"
  | "transport"
  | "utilities"
  | "rent"
  | "health"
  | "education"
  | "shopping"
  | "entertainment"
  | "gifts"
  | "mobile"
  | "other";

export type Category = { id: CategoryId; label: string; icon: LucideIcon };

export const CATEGORIES: Category[] = [
  { id: "groceries", label: "Groceries", icon: ShoppingCart },
  { id: "dining", label: "Dining", icon: UtensilsCrossed },
  { id: "transport", label: "Transport", icon: Bus },
  { id: "utilities", label: "Utilities", icon: Zap },
  { id: "rent", label: "Rent", icon: Home },
  { id: "health", label: "Health", icon: HeartPulse },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "shopping", label: "Shopping", icon: Shirt },
  { id: "entertainment", label: "Fun", icon: Clapperboard },
  { id: "gifts", label: "Gifts", icon: Gift },
  { id: "mobile", label: "Mobile", icon: Smartphone },
  { id: "other", label: "Other", icon: MoreHorizontal },
];

const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

export function category(id: string): Category {
  return BY_ID.get(id as CategoryId) ?? { id: "other", label: id || "Other", icon: MoreHorizontal };
}

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);
