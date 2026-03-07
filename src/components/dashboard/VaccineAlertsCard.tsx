import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Syringe, ChevronRight } from "lucide-react";

const DEMO_ALERTS = [
  { id: "A142", name: "Bessie", message: "Clostridial booster due in ~10 days", status: "due" as const },
  { id: "R401", name: "Ginger", message: "Clostridial booster OVERDUE — vet clearance before vaccinating", status: "overdue" as const },
  { id: "C201", name: "Ishani", message: "Deworming due soon (Feb 25)", status: "due" as const },
];

export default function VaccineAlertsCard() {
  return (
    <motion.div
      className="card-glass rounded-xl overflow-hidden border border-warning/30"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
          <Syringe size={18} className="text-warning" />
          Vaccine & health alerts
        </h3>
        <span className="text-xs font-mono text-muted-foreground">From vaccination record</span>
      </div>
      <div className="p-4 space-y-2">
        {DEMO_ALERTS.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-start gap-2 rounded-lg px-3 py-2 border ${
              alert.status === "overdue" ? "bg-danger/10 border-danger/30" : "bg-warning/10 border-warning/30"
            }`}
          >
            <span className="font-mono font-semibold text-foreground shrink-0">{alert.name} (#{alert.id})</span>
            <span className="text-sm text-foreground/90">{alert.message}</span>
          </div>
        ))}
        <Link
          to="/field-oracle"
          className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary/10 border border-primary/30 text-primary font-display font-semibold text-sm hover:bg-primary/20 transition-colors"
        >
          Ask Field Oracle which animals need vaccines
          <ChevronRight size={16} />
        </Link>
      </div>
    </motion.div>
  );
}
