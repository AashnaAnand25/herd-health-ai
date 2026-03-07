import { RECENT_ALERTS, RiskLevel } from "@/data/syntheticData";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Thermometer, Footprints, Scale, ChevronRight } from "lucide-react";

const ALERT_ICONS: Record<string, typeof Activity> = {
  Feed: Activity, Temp: Thermometer, Gait: Footprints, Weight: Scale,
  Posture: Activity, Activity: Activity,
};

function SeverityLabel({ severity }: { severity: RiskLevel }) {
  const styles: Record<RiskLevel, string> = {
    HIGH:    "text-danger",
    MEDIUM:  "text-warning",
    LOW:     "text-healthy",
    "NO-CALL": "text-muted-foreground",
  };
  return <span className={`font-mono text-[10px] font-bold ${styles[severity]}`}>{severity}</span>;
}

export default function AlertFeed() {
  const navigate = useNavigate();

  return (
    <div className="card-glass rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-display text-sm font-bold text-foreground">Recent Alerts</h3>
        <span className="text-xs font-mono text-danger animate-pulse-danger">
          {RECENT_ALERTS.filter(a => a.severity === "HIGH").length} critical
        </span>
      </div>

      <div className="divide-y divide-border/50">
        {RECENT_ALERTS.map((alert, i) => {
          const Icon = ALERT_ICONS[alert.type] || Activity;
          return (
            <motion.div
              key={alert.id}
              className="flex items-start gap-3 px-4 py-3 hover:bg-field-600/40 cursor-pointer group transition-colors"
              onClick={() => navigate(`/animal/${alert.animalId}`)}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.06 }}
            >
              <div className={`mt-0.5 flex-shrink-0 p-1.5 rounded-md ${
                alert.severity === "HIGH" ? "bg-danger/10" : "bg-warning/10"
              }`}>
                <Icon size={12} className={alert.severity === "HIGH" ? "text-danger" : "text-warning"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground truncate">{alert.message}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <SeverityLabel severity={alert.severity} />
                  <span className="text-[10px] font-mono text-muted-foreground">{alert.timestamp}</span>
                </div>
              </div>
              <ChevronRight size={12} className="text-muted-foreground group-hover:text-primary transition-colors mt-1 flex-shrink-0" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
