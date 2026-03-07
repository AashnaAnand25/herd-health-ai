import { RECENT_ALERTS, RiskLevel } from "@/data/syntheticData";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Thermometer, Footprints, Scale, ChevronRight } from "lucide-react";

const ALERT_ICONS: Record<string, typeof Activity> = {
  Feed: Activity, Temp: Thermometer, Gait: Footprints, Weight: Scale,
  Posture: Activity, Activity: Activity,
};

const SEVERITY_STYLES: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  HIGH:   { bg: "bg-danger/15", text: "text-danger", border: "border-danger/40" },
  MEDIUM: { bg: "bg-warning/15", text: "text-warning", border: "border-warning/40" },
  LOW:    { bg: "bg-healthy/10", text: "text-healthy", border: "border-healthy/30" },
  "NO-CALL": { bg: "bg-field-600", text: "text-muted-foreground", border: "border-border" },
};

export default function AlertFeed() {
  const navigate = useNavigate();
  const criticalCount = RECENT_ALERTS.filter(a => a.severity === "HIGH").length;

  return (
    <div className="card-glass rounded-xl overflow-hidden" id="alerts-section">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-display text-base font-bold text-foreground">Recent alerts</h3>
        {criticalCount > 0 && (
          <span className="text-sm font-mono text-danger font-semibold animate-pulse-danger">
            {criticalCount} critical
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        {RECENT_ALERTS.map((alert, i) => {
          const Icon = ALERT_ICONS[alert.type] || Activity;
          const style = SEVERITY_STYLES[alert.severity];
          return (
            <motion.button
              key={alert.id}
              type="button"
              onClick={() => navigate(`/animal/${alert.animalId}`)}
              className={`w-full text-left rounded-xl border-2 p-4 transition-all hover:scale-[1.01] active:scale-[0.99] ${style.bg} ${style.border} hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 + i * 0.05 }}
            >
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 p-2.5 rounded-lg ${style.bg} border ${style.border}`}>
                  <Icon size={20} className={style.text} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-medium text-foreground leading-snug">{alert.message}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`font-mono text-sm font-bold ${style.text}`}>{alert.severity}</span>
                    <span className="text-sm font-mono text-muted-foreground">{alert.timestamp}</span>
                  </div>
                </div>
                <ChevronRight size={22} className={`${style.text} opacity-70 flex-shrink-0 mt-0.5`} />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
