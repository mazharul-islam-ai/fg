import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

import { ExampleFeature } from "@/components/examples/ExampleFeature";
import { AppShell } from "@/components/layout/AppShell";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";

export default function CompositionDemoPage() {
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
        <Button variant="outline" size="sm" asChild>
          <Link to="/">Back</Link>
        </Button>
      }
    >
      <PageLayout>
        <PageLayout.Header
          eyebrow="Composition"
          title="Patterns that stay beautiful"
          description="Compound PageLayout + AppShell + slot-based Toolbar / EmptyState + render props for lists. Clone this structure for product pages."
        />
        <PageLayout.Content>
          <ExampleFeature />
        </PageLayout.Content>
      </PageLayout>
    </AppShell>
  );
}
