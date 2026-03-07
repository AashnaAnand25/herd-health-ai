import { ANIMALS_LIST, BARN_NAMES, RiskLevel, Animal } from "@/data/syntheticData";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, AlertCircle } from "lucide-react";

const RISK_STYLES: Record<RiskLevel, { bg: string; text: string; border: string; label: string }> = {
  HIGH:   { bg: "bg-danger/15", text: "text-danger", border: "border-danger/40", label: "High risk" },
  MEDIUM: { bg: "bg-warning/15", text: "text-warning", border: "border-warning/40", label: "Medium risk" },
  LOW:    { bg: "bg-healthy/15", text: "text-healthy", border: "border-healthy/40", label: "Low risk" },
  "NO-CALL": { bg: "bg-field-600", text: "text-muted-foreground", border: "border-border", label: "No call" },
};

function getDisplayName(animal: Animal): string {
  return BARN_NAMES[animal.id] || `#${animal.id}`;
}

export default function RiskTable() {
  const navigate = useNavigate();
  const sorted = [...ANIMALS_LIST].sort((a, b) => {
    const order: Record<RiskLevel, number> = { HIGH: 0, MEDIUM: 1, LOW: 2, "NO-CALL": 3 };
    return order[a.riskLevel] - order[b.riskLevel] || b.riskScore - a.riskScore;
  });

  // Show top 8 as big cards; rest are summarized
  const priority = sorted.filter(a => a.riskLevel === "HIGH" || a.riskLevel === "MEDIUM").slice(0, 6);
  const hasMore = sorted.length > priority.length;

  return (
    <div className="card-glass rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-display text-base font-bold text-foreground">Animals to check first</h3>
        <span className="text-sm font-mono text-muted-foreground">{ANIMALS_LIST.length} total</span>
      </div>

      <div className="p-4 space-y-3">
        {priority.map((animal, i) => {
          const style = RISK_STYLES[animal.riskLevel];
          const name = getDisplayName(animal);
          return (
            <motion.button
              key={`${animal.id}-${i}`}
              type="button"
              onClick={() => navigate(`/animal/${animal.id}`)}
              className={`w-full text-left rounded-xl border-2 p-4 transition-all hover:scale-[1.01] active:scale-[0.99] ${style.bg} ${style.border} hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display text-lg font-bold text-foreground">{name}</span>
                    <span className="font-mono text-sm text-muted-foreground">#{animal.id}</span>
                    <span className="text-sm text-muted-foreground">· {animal.breed}</span>
                  </div>
                  {animal.alertReason && (
                    <p className="mt-1.5 text-sm text-foreground/90 line-clamp-2">{animal.alertReason}</p>
                  )}
                  <p className="mt-1 text-xs font-mono text-muted-foreground">{animal.lastActivity}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {animal.riskLevel === "NO-CALL" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono bg-field-700 text-muted-foreground border border-border">
                      <AlertCircle size={12} />
                      NO-CALL
                    </span>
                  ) : (
                    <span className={`inline-flex flex-col items-end px-2.5 py-1 rounded-lg border ${style.border} ${style.text}`}>
                      <span className="font-display text-lg font-bold">{animal.riskScore}%</span>
                      <span className="text-[10px] font-mono uppercase tracking-wider">{animal.riskLevel}</span>
                    </span>
                  )}
                  <ChevronRight size={20} className={`${style.text} opacity-70`} />
                </div>
              </div>
            </motion.button>
          );
        })}

        {hasMore && (
          <div className="pt-2">
            <Link
              to="/livefeed"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-colors text-sm font-medium"
            >
              View all animals in Live Feed
              <ChevronRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
