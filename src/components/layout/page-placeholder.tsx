import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type PagePlaceholderProps = {
  title: string;
  description: string;
  statusLabel: string;
  statusDescription: string;
};

export function PagePlaceholder({
  title,
  description,
  statusLabel,
  statusDescription,
}: PagePlaceholderProps) {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <h1 className="type-page-title">{title}</h1>
      <p className="type-secondary mt-2 max-w-2xl">{description}</p>
      <Card className="mt-8 border-dashed bg-card/70 shadow-none">
        <CardContent className="flex items-start gap-4 p-0">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Construction aria-hidden="true" className="size-5" />
          </span>
          <div className="space-y-1">
            <h2 className="type-card-title">{statusLabel}</h2>
            <p className="type-secondary">{statusDescription}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
