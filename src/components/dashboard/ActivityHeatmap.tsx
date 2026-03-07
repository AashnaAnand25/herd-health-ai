import { HEATMAP_DATA } from "@/data/syntheticData";
import { motion } from "framer-motion";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getColor(val: number) {
  if (val >= 70) return "hsl(88 60% 40%)";
  if (val >= 55) return "hsl(88 40% 28%)";
  if (val >= 40) return "hsl(37 80% 40%)";
  if (val >= 30) return "hsl(20 80% 40%)";
  return "hsl(3 70% 38%)";
}

function getTextColor(val: number) {
  return val >= 70 ? "hsl(88 100% 75%)" : val >= 55 ? "hsl(88 60% 65%)" : val >= 40 ? "hsl(37 91% 65%)" : "hsl(3 79% 70%)";
}

export default function ActivityHeatmap() {
  return (
    <div className="card-glass rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <h3 className="font-display text-sm font-bold text-foreground">7-Day Activity Heatmap</h3>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Activity index by pen · hover for details</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "hsl(3 70% 38%)" }} />Low</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "hsl(88 60% 40%)" }} />High</span>
        </div>
      </div>

      <div className="p-4 overflow-x-auto">
        <div className="min-w-[340px]">
          {/* Day headers */}
          <div className="grid grid-cols-8 gap-1 mb-1">
            <div />
            {DAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-mono text-muted-foreground">{d}</div>
            ))}
          </div>

          {/* Heatmap rows */}
          {HEATMAP_DATA.map((row, ri) => (
            <motion.div
              key={row.pen}
              className="grid grid-cols-8 gap-1 mb-1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: ri * 0.08 }}
            >
              <div className="text-[10px] font-mono text-muted-foreground truncate flex items-center pr-1">
                {row.pen.split(" — ")[0]}
              </div>
              {DAYS.map(day => {
                const val = row[day as keyof typeof row] as number;
                return (
                  <div
                    key={day}
                    className="relative h-9 rounded-md flex items-center justify-center cursor-default group transition-all hover:scale-105"
                    style={{ background: getColor(val), border: `1px solid ${getColor(val)}88` }}
                    title={`${row.pen} · ${day}: ${val}`}
                  >
                    <span className="text-[11px] font-mono font-semibold" style={{ color: getTextColor(val) }}>
                      {val}
                    </span>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 whitespace-nowrap">
                      <div className="bg-field-700 border border-border rounded px-2 py-1 text-[10px] font-mono text-foreground shadow-card">
                        {row.pen} · {day}: <span style={{ color: getTextColor(val) }}>{val}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
