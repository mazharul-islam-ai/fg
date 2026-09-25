import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";

type AppShellProps = {
  brand: ReactNode;
  nav?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Product chrome: top bar + main. Compose nav links and actions as slots.
 *
 * @example
 * <AppShell
 *   brand={<span className="font-semibold">Acme</span>}
 *   nav={<AppShell.NavLink to="/">Home</AppShell.NavLink>}
 *   actions={<Button size="sm">New</Button>}
 * >
 *   {page}
 * </AppShell>
 */
function AppShellRoot({ brand, nav, actions, children, className }: AppShellProps) {
  return (
    <div className={cn("flex min-h-screen flex-col bg-background", className)}>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="truncate text-sm font-semibold tracking-tight text-foreground">{brand}</div>
            {nav ? <nav className="hidden items-center gap-1 sm:flex">{nav}</nav> : null}
          </div>
          {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}

type NavLinkProps = {
  to: string;
  children: ReactNode;
  end?: boolean;
  className?: string;
};

function AppShellNavLink({ to, children, end, className }: NavLinkProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
          isActive
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          className,
        )
      }
    >
      {children}
    </NavLink>
  );
}

export const AppShell = Object.assign(AppShellRoot, {
  NavLink: AppShellNavLink,
});
