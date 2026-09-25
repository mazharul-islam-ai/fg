import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageLayoutProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

/**
 * Compound page shell â compose Header / Content / Footer as children.
 * Often nested inside AppShell for product chrome.
 */
function PageLayoutRoot({ children, className, ...props }: PageLayoutProps) {
  return (
    <div className={cn("flex flex-1 flex-col", className)} {...props}>
      {children}
    </div>
  );
}

type HeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
  className?: string;
};

function PageLayoutHeader({ title, description, actions, eyebrow, className }: HeaderProps) {
  return (
    <header className={cn("border-b border-border/70 bg-card/40", className)}>
      <div className="container mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl space-y-2">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
          ) : null}
          <h1 className="text-3xl font-semibold tracking-tight text-foreground text-balance">{title}</h1>
          {description ? (
            <p className="text-sm leading-relaxed text-muted-foreground text-balance">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

type ContentProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  width?: "default" | "wide" | "full";
};

function PageLayoutContent({ children, className, width = "wide", ...props }: ContentProps) {
  const widthClass =
    width === "full" ? "max-w-none" : width === "default" ? "max-w-3xl" : "max-w-5xl";

  return (
    <main
      className={cn("container mx-auto flex-1 px-4 py-8 animate-fade-in", widthClass, className)}
      {...props}
    >
      {children}
    </main>
  );
}

type FooterProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
};

function PageLayoutFooter({ children, className, ...props }: FooterProps) {
  return (
    <footer className={cn("mt-auto border-t border-border/70", className)} {...props}>
      <div className="container mx-auto max-w-5xl px-4 py-5 text-sm text-muted-foreground">
        {children}
      </div>
    </footer>
  );
}

export const PageLayout = Object.assign(PageLayoutRoot, {
  Header: PageLayoutHeader,
  Content: PageLayoutContent,
  Footer: PageLayoutFooter,
});
