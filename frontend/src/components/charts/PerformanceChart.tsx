import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DashboardTrendPoint } from "../../types/dashboard";

export const PerformanceChart = ({ data }: { data: DashboardTrendPoint[] }) => (
  <div className="h-80 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#243041" vertical={false} />
        <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
        <YAxis yAxisId="workload" stroke="#94a3b8" tickLine={false} axisLine={false} />
        <YAxis yAxisId="fatigue" orientation="right" stroke="#64748b" tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#020617",
            borderColor: "rgba(148, 163, 184, 0.18)",
            borderRadius: "16px",
          }}
          labelStyle={{ color: "#e2e8f0" }}
        />
        <Legend wrapperStyle={{ paddingTop: "16px" }} />
        <Line
          yAxisId="workload"
          type="monotone"
          dataKey="avgWorkload"
          name="Carga média"
          stroke="#7fda89"
          strokeWidth={3}
          dot={{ r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
        <Line
          yAxisId="fatigue"
          type="monotone"
          dataKey="avgFatigue"
          name="Fadiga média"
          stroke="#f97316"
          strokeWidth={2.5}
          dot={{ r: 3, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);
