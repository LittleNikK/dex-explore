import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/Skeleton";

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
      <div className="p-5 sm:p-6 flex flex-col justify-between gap-3 min-h-[140px]">
        <div className="space-y-2">
          <div className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground/80 font-semibold">
            {label}
          </div>
          {loading ? (
            <Skeleton className="h-8 w-24 rounded-2xl" />
          ) : (
            <div className={`text-2xl sm:text-3xl font-bold tracking-tight ${toneClasses[tone]}`}>
              {value}
            </div>
          )}
        </div>
        {helper ? (
          <div className="text-[11px] sm:text-xs text-muted-foreground/75 leading-normal break-words">
            {helper}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
