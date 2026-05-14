import { cn } from "../lib/cn";

interface Props {
  start: number;
  end: number;
  value: number;
  onChange: (year: number) => void;
  className?: string;
}

export function YearSlider({ start, end, value, onChange, className }: Props) {
  const years = [];
  for (let y = start; y <= end; y++) years.push(y);

  return (
    <div className={cn("island px-4 py-3", className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] font-medium text-muted-foreground">
          Годовой срез
        </div>
        <div className="text-sm font-semibold tabular-nums">{value}</div>
      </div>
      <input
        type="range"
        min={start}
        max={end}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--accent)]"
      />
      <div className="flex justify-between mt-1 text-[10px] font-mono text-muted-foreground tabular-nums">
        <span>{start}</span>
        <span>{end}</span>
      </div>
      <div className="sr-only">Доступные годы: {years.join(", ")}</div>
    </div>
  );
}