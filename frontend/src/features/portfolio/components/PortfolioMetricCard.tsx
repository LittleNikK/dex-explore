import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PortfolioMetricCardProps {
  label: string;
  value: string;
  helper?: string;
  loading?: boolean;
  tone?: "default" | "success" | "warning" | "destructive";
}

const toneClasses: Record<NonNullable<PortfolioMetricCardProps["tone"]>, string> = {
  default: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

export function PortfolioMetricCard({ label, value, helper, loading, tone = "default" }: PortfolioMetricCardProps) {
  return (
    <Card className="glass border-white/60 shadow-float">
      <CardContent className="space-y-2 p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
        {loading ? (
          <Skeleton className="h-8 w-24 rounded-2xl" />
        ) : (
          <div className={`text-2xl font-semibold tracking-tight ${toneClasses[tone]}`}>{value}</div>
        )}
        {helper ? <div className="text-xs text-muted-foreground">{helper}</div> : null}
      </CardContent>
    </Card>
  );
}
