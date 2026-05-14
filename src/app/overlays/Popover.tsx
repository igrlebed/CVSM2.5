import * as RPopover from "@radix-ui/react-popover";
import { ReactNode } from "react";
import { cn } from "../lib/cn";

interface Props {
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}

export function Popover({
  trigger,
  children,
  align = "start",
  className,
  open,
  onOpenChange,
}: Props) {
  return (
    <RPopover.Root open={open} onOpenChange={onOpenChange}>
      <RPopover.Trigger asChild>{trigger}</RPopover.Trigger>
      <RPopover.Portal>
        <RPopover.Content
          align={align}
          sideOffset={6}
          className={cn(
            "fm-popover z-50 bg-card rounded-xl p-2 min-w-[220px]",
            className,
          )}
          style={{
            boxShadow: "var(--shadow-overlay)",
          }}
        >
          {children}
        </RPopover.Content>
      </RPopover.Portal>
    </RPopover.Root>
  );
}