import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "../lib/cn";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  side?: "right" | "left";
  width?: string;
  footer?: ReactNode;
}

export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  side = "right",
  width = "420px",
  footer,
}: Props) {
  const shadowStyle =
    side === "right"
      ? { boxShadow: "-2px 0 24px rgba(14,21,35,0.10), -1px 0 0 var(--border-soft)" }
      : { boxShadow: "2px 0 24px rgba(14,21,35,0.10), 1px 0 0 var(--border-soft)" };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fm-overlay fixed inset-0 bg-foreground/15 backdrop-blur-sm z-[1090]" />
        <Dialog.Content
          style={{ width, ...shadowStyle }}
          className={cn(
            "fixed top-0 bottom-0 z-[1100] bg-card flex flex-col",
            side === "right" ? "right-0 fm-drawer-right" : "left-0 fm-drawer-left",
          )}
        >
          <div
            className="flex items-center justify-between px-5 py-3.5 shrink-0"
            style={{ borderBottom: "1px solid var(--border-soft)" }}
          >
            <Dialog.Title className="text-sm font-semibold">{title}</Dialog.Title>
            <Dialog.Close
              className="text-muted-foreground hover:text-foreground p-1.5 -mr-1 rounded-md hover:bg-muted transition-colors"
              aria-label="Закрыть"
            >
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            {description ?? title}
          </Dialog.Description>
          <div className="flex-1 overflow-auto">{children}</div>
          {footer && (
            <div
              className="px-5 py-3 shrink-0"
              style={{
                borderTop: "1px solid var(--border-soft)",
                background: "var(--surface)",
              }}
            >
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
