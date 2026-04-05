import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SquadAthlete } from "../../types/athlete";
import { ChartCard } from "../dashboard/ChartCard";

interface AthleteTrendChartProps {
  athlete: SquadAthlete;
  dataKey: "load" | "risk" | "recovery" | "intensity";
  title: string;
  subtitle: string;
  color: string;
  formatter?: (value: number) => string;
}

export const AthleteTrendChart = ({
  athlete,
  dataKey,
  title,
  subtitle,
  color,
  formatter = (value) => String(value),
}: AthleteTrendChartProps) => (
  <ChartCard title={title} subtitle={subtitle}>
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={athlete.history}>
        <defs>
          <linearGradient id={`${athlete.id}-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.42} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="label" stroke="#6b7a90" tickLine={false} axisLine={false} />
        <YAxis stroke="#6b7a90" tickLine={false} axisLine={false} />
        <Tooltip
          cursor={{ stroke: "rgba(255,255,255,0.18)" }}
          contentStyle={{ background: "#0b1421", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16 }}
          formatter={(value: number) => formatter(value)}
        />
        <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#${athlete.id}-${dataKey})`} strokeWidth={3} />
      </AreaChart>
    </ResponsiveContainer>
  </ChartCard>
);
