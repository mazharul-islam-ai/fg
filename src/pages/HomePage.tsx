import { Link } from "react-router-dom";
import { ArrowRight, LayoutTemplate, Sparkles } from "lucide-react";

import { ExampleFeature } from "@/components/examples/ExampleFeature";
import { AppShell } from "@/components/layout/AppShell";
import { PageLayout } from "@/components/layout/PageLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useHealth } from "@/hooks/useHealth";

export default function HomePage() {
  const health = useHealth();

  return (
    <AppShell
      brand={
        <span className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          Project starter
        </span>
      }
      nav={
        <>
          <AppShell.NavLink to="/" end>
            Home
          </AppShell.NavLink>
          <AppShell.NavLink to="/composition">Patterns</AppShell.NavLink>
        </>
      }
      actions={
        <Badge variant={health.data?.ok ? "success" : "muted"}>
          {health.isLoading ? "Checkingâ¦" : health.data?.ok ? "API ready" : "API idle"}
        </Badge>
      }
    >
      <PageLayout>
        <PageLayout.Header
          eyebrow="Modern product UI"
          title="Build on this design system"
          description="Vite + React + Tailwind tokens + Radix/shadcn + React Query v5 + Supabase Auth v2. Ship clear hierarchy, soft surfaces, and full empty/loading states â not generic forms."
          actions={
            <>
              <Button variant="outline" asChild>
                <Link to="/composition">
                  <LayoutTemplate className="h-4 w-4" />
                  Composition
                </Link>
              </Button>
              <Button asChild>
                <a href="https://ui.shadcn.com" target="_blank" rel="noreferrer">
                  Add components
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </>
          }
        />

        <PageLayout.Content className="flex flex-col gap-8">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Tokens first",
                body: "Use primary / muted / card â never one-off hex palettes.",
              },
              {
                title: "Compose chrome",
                body: "AppShell for nav, PageLayout for page hierarchy.",
              },
              {
                title: "Copy golden hooks",
                body: "useAuth (Supabase v2) and useHealth (React Query v5).",
              },
            ].map((item) => (
              <Card key={item.title} className="shadow-soft">
                <CardHeader className="space-y-2 p-5">
                  <CardTitle className="text-sm font-semibold">{item.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{item.body}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          <ExampleFeature
            banner={
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">Inbox pattern</h2>
                  <p className="text-sm text-muted-foreground">
                    Reference list UI â replace with your domain feature.
                  </p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/composition">Open full example</Link>
                </Button>
              </div>
            }
          />
        </PageLayout.Content>

        <PageLayout.Footer>
          Seed path: <code className="text-xs">boilerplate/project-boilerplate-starter</code>
        </PageLayout.Footer>
      </PageLayout>
    </AppShell>
  );
}
