import { HEALTH_TREND } from "@/data/syntheticData";
import { motion } from "framer-motion";
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Legend,
} from "recharts";

const DISPLAYED = HEALTH_TREND.filter((_, i) => i % 3 === 0 || i === HEALTH_TREND.length - 1);

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-field-700 border border-border rounded-lg px-3 py-2 text-xs font-mono shadow-card">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

export default function HealthTrendChart() {
  const data = HEALTH_TREND;
  const min = Math.min(...data.map(d => d.actual)) - 2;
  const max = 100;

  return (
    <div className="card-glass rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h3 className="font-display text-sm font-bold text-foreground">Herd Health Trend — 30 Days</h3>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Daily average health score with confidence band</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="flex items-center gap-1 text-primary">
            <span className="w-4 h-0.5 inline-block bg-primary rounded" />Actual
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <span className="w-4 h-0 inline-block border-t border-dashed border-muted-foreground" />Baseline
          </span>
        </div>
      </div>

      <div className="p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="h-[200px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(88 100% 62%)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(88 100% 62%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradBaseline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(130 30% 50%)" stopOpacity={0.08} />
                  <stop offset="95%" stopColor="hsl(130 30% 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 9, fontFamily: "IBM Plex Mono", fill: "hsl(130 15% 55%)" }}
                interval={4}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[min, max]}
                tick={{ fontSize: 9, fontFamily: "IBM Plex Mono", fill: "hsl(130 15% 55%)" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="baseline"
                stroke="hsl(130 25% 45%)"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                fill="url(#gradBaseline)"
                dot={false}
                name="Baseline"
              />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="hsl(88 100% 62%)"
                strokeWidth={2}
                fill="url(#gradActual)"
                dot={false}
                name="Actual"
                style={{ filter: "drop-shadow(0 0 3px hsl(88 100% 62% / 0.4))" }}
              />
              <ReferenceLine y={80} stroke="hsl(37 91% 55% / 0.4)" strokeDasharray="2 4" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
