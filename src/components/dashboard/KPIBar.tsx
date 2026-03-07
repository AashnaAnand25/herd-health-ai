import { KPI_DATA, RECENT_ALERTS, ANIMALS_LIST } from "@/data/syntheticData";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, Heart, Monitor } from "lucide-react";

function CircularProgress({ value, max = 100 }: { value: number; max?: number }) {
  const pct = value / max;
  const r = 24;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;

  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
      <circle cx="32" cy="32" r={r} fill="none" stroke="hsl(88 40% 15%)" strokeWidth="4" />
      <circle
        cx="32" cy="32" r={r} fill="none"
        stroke="hsl(88 100% 62%)"
        strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 4px hsl(88 100% 62% / 0.7))" }}
      />
    </svg>
  );
}

const KPI_CARDS = [
  {
    label: "Total Monitored",
    value: KPI_DATA.totalAnimals,
    icon: Monitor,
    color: "text-foreground",
    accent: "border-border",
    suffix: "head",
    scrollTarget: null as string | null,
  },
  {
    label: "Animals at Risk",
    value: KPI_DATA.atRisk,
    icon: AlertTriangle,
    color: "text-warning",
    accent: "border-warning/30",
    suffix: "flagged",
    pulse: "animate-pulse-warning",
    scrollTarget: "risk-section",
  },
  {
    label: "Critical Alerts Today",
    value: KPI_DATA.criticalAlerts,
    icon: Activity,
    color: "text-danger",
    accent: "border-danger/30",
    suffix: "active",
    pulse: "animate-pulse-danger",
    scrollTarget: "alerts-section",
  },
];

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function KPIBar() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {KPI_CARDS.map((kpi, i) => {
        const content = (
          <>
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
              <kpi.icon size={16} className={`${kpi.color} ${("pulse" in kpi && kpi.pulse) || ""}`} />
            </div>
            <div className="flex items-end gap-2">
              <span className={`font-display text-3xl font-bold ${kpi.color}`}>{kpi.value}</span>
              <span className="text-xs font-mono text-muted-foreground mb-1">{kpi.suffix}</span>
            </div>
          </>
        );
        const cardClass = `card-glass rounded-xl p-4 border ${kpi.accent} ${kpi.scrollTarget ? "cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform" : ""}`;
        return (
          <motion.div
            key={kpi.label}
            className={cardClass}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={kpi.scrollTarget ? () => scrollToSection(kpi.scrollTarget!) : undefined}
            onKeyDown={kpi.scrollTarget ? (e) => e.key === "Enter" && scrollToSection(kpi.scrollTarget!) : undefined}
            role={kpi.scrollTarget ? "button" : undefined}
            tabIndex={kpi.scrollTarget ? 0 : undefined}
          >
            {content}
          </motion.div>
        );
      })}

      {/* Health Score with ring */}
      <motion.div
        className="card-glass rounded-xl p-4 border border-primary/20"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24 }}
      >
        <div className="flex items-start justify-between mb-1">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Herd Health Score</p>
          <Heart size={16} className="text-primary animate-pulse-lime" />
        </div>
        <div className="flex items-center gap-3">
          <CircularProgress value={KPI_DATA.herdHealthScore} />
          <div>
            <span className="font-display text-3xl font-bold text-primary">{KPI_DATA.herdHealthScore}</span>
            <span className="text-xs font-mono text-muted-foreground">/100</span>
            <p className="text-xs text-healthy mt-0.5 font-mono">+2 vs last week</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
