"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { LanguageStat } from "@/types/github";

const CATEGORY_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];
const OTHER_COLOR = "var(--muted-foreground)";
const MAX_SLICES = CATEGORY_COLORS.length;

interface Slice {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export function LanguageChart({ data }: { data: LanguageStat[] }) {
  const total = data.reduce((sum, l) => sum + l.bytes, 0);
  const top = data.slice(0, MAX_SLICES);
  const rest = data.slice(MAX_SLICES);
  const otherBytes = rest.reduce((sum, l) => sum + l.bytes, 0);

  const slices: Slice[] = top.map((l, i) => ({
    name: l.language,
    value: l.bytes,
    percentage: l.percentage,
    color: CATEGORY_COLORS[i],
  }));
  if (otherBytes > 0) {
    slices.push({
      name: "Other",
      value: otherBytes,
      percentage: (otherBytes / total) * 100,
      color: OTHER_COLOR,
    });
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={slices}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          outerRadius={92}
          paddingAngle={2}
          stroke="var(--card)"
          strokeWidth={2}
        >
          {slices.map((slice) => (
            <Cell key={slice.name} fill={slice.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => {
            const bytes = typeof value === "number" ? value : 0;
            return [`${((bytes / total) * 100).toFixed(1)}%`, name];
          }}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--popover-foreground)",
            fontSize: 13,
          }}
        />
        <Legend
          layout="vertical"
          verticalAlign="middle"
          align="right"
          formatter={(value) => <span style={{ color: "var(--foreground)" }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
