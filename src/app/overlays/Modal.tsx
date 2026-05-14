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
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

const SIZE = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
};

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
}: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fm-overlay fixed inset-0 bg-foreground/20 backdrop-blur-sm z-[1090]" />
        <Dialog.Content
          className={cn(
            "fm-modal fixed z-[1100] w-[calc(100vw-2rem)]",
            "bg-card flex flex-col",
            SIZE[size],
          )}
          /* Position via inline style so animations don't conflict with CSS transforms */
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            borderRadius: "calc(var(--radius) + 4px)",
            boxShadow: "var(--shadow-overlay)",
          }}
        >
          <div
            className="flex items-start justify-between gap-4 px-6 py-4 shrink-0"
            style={{ borderBottom: "1px solid var(--border-soft)" }}
          >
            <div className="min-w-0">
              <Dialog.Title className="text-sm font-semibold leading-snug">{title}</Dialog.Title>
              {description && (
                <Dialog.Description className="mt-0.5 text-xs text-muted-foreground">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className="text-muted-foreground hover:text-foreground p-1.5 -m-1 rounded-md hover:bg-muted shrink-0 transition-colors"
              aria-label="Закрыть"
            >
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <div className="px-6 py-5 max-h-[60vh] overflow-auto">{children}</div>

          {footer && (
            <div
              className="flex items-center justify-end gap-2 px-6 py-3.5 shrink-0"
              style={{
                borderTop: "1px solid var(--border-soft)",
                background: "var(--surface)",
                borderBottomLeftRadius: "calc(var(--radius) + 4px)",
                borderBottomRightRadius: "calc(var(--radius) + 4px)",
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
