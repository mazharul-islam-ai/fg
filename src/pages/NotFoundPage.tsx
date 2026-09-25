import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
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
    >
      <PageLayout>
        <PageLayout.Content className="flex items-center justify-center py-24">
          <EmptyState
            title="Page not found"
            description="That route does not exist. Head home and continue from there."
            action={
              <Button asChild>
                <Link to="/">Back home</Link>
              </Button>
            }
          />
        </PageLayout.Content>
      </PageLayout>
    </AppShell>
  );
}
