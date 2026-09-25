/**
 * Composition example â polished list feature AI agents should mirror.
 */

import { Inbox, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";

import { EmptyState } from "@/components/layout/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type DemoItem = {
  id: string;
  title: string;
  status: "open" | "done";
};

type ToolbarProps = {
  search: ReactNode;
  actions: ReactNode;
  className?: string;
};

function Toolbar({ search, actions, className }: ToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-soft sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 flex-1">{search}</div>
      <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
    </div>
  );
}

type ItemCardProps = {
  item: DemoItem;
  trailing?: ReactNode;
  onToggle?: (id: string) => void;
};

function ItemCard({ item, trailing, onToggle }: ItemCardProps) {
  return (
    <li>
      <div className="group flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-soft transition-colors hover:border-primary/30">
        <div className="min-w-0 space-y-1.5">
          <p className="truncate font-medium text-foreground">{item.title}</p>
          <Badge variant={item.status === "done" ? "success" : "muted"} className="capitalize">
            {item.status}
          </Badge>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onToggle ? (
            <Button type="button" variant="outline" size="sm" onClick={() => onToggle(item.id)}>
              {item.status === "open" ? "Complete" : "Reopen"}
            </Button>
          ) : null}
          {trailing}
        </div>
      </div>
    </li>
  );
}

type ItemListProps = {
  items: DemoItem[];
  renderItem: (item: DemoItem) => ReactNode;
  empty: ReactNode;
};

function ItemList({ items, renderItem, empty }: ItemListProps) {
  if (items.length === 0) return <>{empty}</>;
  return <ul className="flex flex-col gap-3">{items.map(renderItem)}</ul>;
}

type ExampleFeatureProps = {
  banner?: ReactNode;
  initialItems?: DemoItem[];
};

const DEFAULT_ITEMS: DemoItem[] = [
  { id: "1", title: "Compose layouts with AppShell + PageLayout", status: "done" },
  { id: "2", title: "Ship empty / loading / error states for every list", status: "open" },
  { id: "3", title: "One primary CTA per view â keep hierarchy clear", status: "open" },
];

export function ExampleFeature({ banner, initialItems = DEFAULT_ITEMS }: ExampleFeatureProps) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState(initialItems);

  const filtered = items.filter((item) => item.title.toLowerCase().includes(query.trim().toLowerCase()));

  const toggle = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: item.status === "open" ? "done" : "open" } : item,
      ),
    );
  };

  const addItem = () => {
    const title = query.trim() || `New item ${items.length + 1}`;
    setItems((prev) => [...prev, { id: crypto.randomUUID(), title, status: "open" }]);
    setQuery("");
  };

  return (
    <div className="flex flex-col gap-6">
      {banner}

      <Toolbar
        search={
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter or type a new titleâ¦"
            aria-label="Filter items"
            className="border-0 bg-muted/60 shadow-none focus-visible:ring-1"
          />
        }
        actions={
          <Button type="button" onClick={addItem}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        }
      />

      <ItemList
        items={filtered}
        renderItem={(item) => <ItemCard key={item.id} item={item} onToggle={toggle} />}
        empty={
          <EmptyState
            icon={<Inbox className="h-5 w-5" />}
            title="No items match"
            description="Clear the filter or add a new item to keep momentum."
            action={
              <Button type="button" variant="secondary" onClick={addItem}>
                Add item
              </Button>
            }
          />
        }
      />

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base">UI patterns to copy</CardTitle>
          <CardDescription>
            Soft surfaces, one primary action, composed Toolbar + list + EmptyState. Extend this â
            do not invent a second visual language.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ul className="list-inside list-disc space-y-1">
            <li>
              <strong className="text-foreground">Slots</strong> for actions & empty CTAs
            </li>
            <li>
              <strong className="text-foreground">renderItem</strong> to customize rows
            </li>
            <li>
              <strong className="text-foreground">AppShell + PageLayout</strong> for product chrome
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
