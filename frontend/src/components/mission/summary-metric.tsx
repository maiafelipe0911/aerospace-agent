interface SummaryMetricProps {
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
}

export function SummaryMetric({ label, value, unit, highlight }: SummaryMetricProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`font-mono text-sm ${highlight ? "font-semibold text-primary" : ""}`}
      >
        {value}
        {unit && (
          <span className="text-xs text-muted-foreground ml-1">{unit}</span>
        )}
      </p>
    </div>
  );
}
