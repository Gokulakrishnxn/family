import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export function MemberAvatar({
  name,
  className,
  active = false,
}: {
  name: string;
  className?: string;
  active?: boolean;
}) {
  return (
    <Avatar className={cn("size-9 rounded-xl border", active && "ring-2 ring-foreground", className)}>
      <AvatarFallback
        className={cn(
          "rounded-xl text-xs font-semibold",
          active ? "bg-foreground text-background" : "bg-muted text-foreground",
        )}
      >
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
